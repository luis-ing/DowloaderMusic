import express from "express";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import downloadMusicRoutes from "./routes/downloadMusic.routes.js";
import { publicDir, __dirname } from "./utils/index.js";

const app = express();
// Middlewares
// Este middleware permite obtener los datos de la aplicacion cliente en formato json
app.use(express.json());

app.use(downloadMusicRoutes);

app.use('/files', express.static(path.resolve(publicDir)));

async function main() {
    try {
        const port = 3001;
        app.listen(port, function () {
            console.log("Servidor en puerto ", port);
        });
    } catch (error) {
        console.error('Error en el servidor: ', error);
    }
}

main();