import fs from 'fs';
import ytpl from 'ytpl';
import path from 'path';
import { downloadSong, downloadPlaylist } from "../utils/index.js";

export const donwnloadMusic = async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        let filePaths;
        if (ytpl.validateID(url)) {
            // Handle playlist URL
            filePaths = await downloadPlaylist(url);
        } else {
            // Handle single video URL
            const filePath = await downloadSong(url);
            filePaths = [filePath];
        }

        const downloadLinks = filePaths.map(filePath => {
            const fileName = path.basename(filePath);
            return `${req.protocol}://${req.get('host')}/files/${fileName}`;
        });

        res.json(downloadLinks);
    } catch (error) {
        res.status(500).send(`Error downloading song(s): ${error.message}`);
    }
}