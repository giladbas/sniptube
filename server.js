const express = require('express');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR);
}

// Check that yt-dlp and ffmpeg are available
function checkBinary(name) {
  return new Promise((resolve) => {
    const proc = spawn('which', [name]);
    proc.on('close', (code) => resolve(code === 0));
  });
}

async function preflight() {
  const hasYtDlp = await checkBinary('yt-dlp');
  const hasFfmpeg = await checkBinary('ffmpeg');
  if (!hasYtDlp) {
    console.error('ERROR: yt-dlp is not installed. Run: brew install yt-dlp');
    process.exit(1);
  }
  if (!hasFfmpeg) {
    console.error('ERROR: ffmpeg is not installed. Run: brew install ffmpeg');
    process.exit(1);
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} failed (code ${code}): ${stderr}`));
    });
  });
}

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/.test(url);
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9 _\-\.]/g, '').substring(0, 100);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get video info
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const output = await run('yt-dlp', ['--dump-json', '--no-playlist', url]);
    const info = JSON.parse(output);
    res.json({
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      videoId: info.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download (with optional trim and format conversion)
app.post('/api/download', async (req, res) => {
  const { url, format, startTime, endTime } = req.body;

  if (!url || !isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  if (!['mp3', 'mp4'].includes(format)) {
    return res.status(400).json({ error: 'Format must be mp3 or mp4' });
  }

  const jobId = uuidv4();
  const jobDir = path.join(DOWNLOADS_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  try {
    // Step 1: Get video info for filename
    const infoOutput = await run('yt-dlp', ['--dump-json', '--no-playlist', url]);
    const info = JSON.parse(infoOutput);
    const safeTitle = sanitizeFilename(info.title) || 'video';

    // Step 2: Download
    const rawFile = path.join(jobDir, 'raw.%(ext)s');
    const dlArgs =
      format === 'mp3'
        ? ['-f', 'bestaudio', '-o', rawFile, '--no-playlist', url]
        : ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]', '-o', rawFile, '--no-playlist', '--merge-output-format', 'mp4', url];

    await run('yt-dlp', dlArgs);

    // Find the downloaded file
    const files = fs.readdirSync(jobDir);
    const rawFilePath = path.join(jobDir, files.find((f) => f.startsWith('raw')));

    // Step 3: Trim and/or convert with ffmpeg
    const needsTrim = startTime != null && endTime != null && (startTime > 0 || endTime < info.duration);
    const outputFile = path.join(jobDir, `${safeTitle}.${format}`);

    if (needsTrim || format === 'mp3') {
      const ffmpegArgs = ['-i', rawFilePath];

      if (needsTrim) {
        ffmpegArgs.push('-ss', String(startTime), '-to', String(endTime));
      }

      if (format === 'mp3') {
        ffmpegArgs.push('-vn', '-ab', '192k', '-f', 'mp3');
      } else {
        ffmpegArgs.push('-c', 'copy');
      }

      ffmpegArgs.push('-y', outputFile);
      await run('ffmpeg', ffmpegArgs);
    } else {
      // No trim needed for mp4, just rename
      fs.renameSync(rawFilePath, outputFile);
    }

    // Step 4: Send file
    res.download(outputFile, `${safeTitle}.${format}`, (err) => {
      // Cleanup job directory after send
      fs.rm(jobDir, { recursive: true, force: true }, () => {});
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Failed to send file' });
      }
    });
  } catch (err) {
    // Cleanup on error
    fs.rm(jobDir, { recursive: true, force: true }, () => {});
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

preflight().then(() => {
  app.listen(PORT, () => {
    console.log(`SnipTube running at http://localhost:${PORT}`);
  });
});
