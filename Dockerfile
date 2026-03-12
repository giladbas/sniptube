FROM node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 curl unzip && \
    update-ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    curl -fsSL https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip -o /tmp/deno.zip && \
    unzip /tmp/deno.zip -d /usr/local/bin && \
    chmod a+rx /usr/local/bin/deno && \
    rm /tmp/deno.zip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
