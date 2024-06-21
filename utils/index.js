import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import axios from 'axios';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import NodeID3 from 'node-id3';

const __dirname = dirname(fileURLToPath(import.meta.url));

ffmpeg.setFfmpegPath(ffmpegPath);

const publicDir = path.resolve(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

async function downloadSong(url) {
    try {
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        // Limpiar título de caracteres extraños para nombre de archivo 
        const title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, '-');
        const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;

        const output = path.resolve(publicDir, `${title}.mp3`);

        // Descargar imagen thumbnail
        const thumbnailPath = path.resolve(publicDir, `${title}.jpg`);
        const response = await axios({
            url: thumbnail,
            responseType: 'stream'
        });

        await new Promise((resolve, reject) => {
            const stream = response.data.pipe(fs.createWriteStream(thumbnailPath));
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        // Descargar audio y convertir a mp3
        await new Promise((resolve, reject) => {
            ffmpeg(ytdl(url, { quality: 'highestaudio' }))
                .audioBitrate(320)
                .save(output)
                .on('end', async () => {
                    // Agregue etiquetas ID3, incluida la imagen de portada
                    const tags = {
                        title: info.videoDetails.title,
                        artist: info.videoDetails.author.name,
                        album: info.videoDetails.media ? info.videoDetails.media.album : 'Unknown Album',
                        APIC: thumbnailPath
                    };

                    NodeID3.write(tags, output, (err) => {
                        if (err) {
                            reject(`Error writing ID3 tags: ${err.message}`);
                        } else {
                            resolve();
                        }
                    });
                })
                .on('error', reject);
        });

        return output;
    } catch (error) {
        console.error(`Error al intenter descargar ${url}: ${error.message}`);
        throw error;
    }
}

async function downloadPlaylist(playlistUrl) {
    try {
        const playlist = await ytpl(playlistUrl);
        const downloadPromises = playlist.items.map(async (item) => {
            return await downloadSong(item.shortUrl);
        });
        return await Promise.all(downloadPromises);
    } catch (error) {
        console.error(`Error downloading playlist: ${error.message}`);
        throw error;
    }
}

export { downloadSong, downloadPlaylist, publicDir, __dirname };