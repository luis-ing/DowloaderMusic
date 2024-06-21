import { Router } from "express";
import { donwnloadMusic } from "../controllers/downloadMusic.controller.js";

const router = Router();

router.post('/downloadMusic', donwnloadMusic);


export default router;