import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import accountRouter from "./routes/accountsRouter";
import imageDownloadRouter from "./routes/imageDownloadRouter";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", accountRouter);
app.use("/image", imageDownloadRouter);

export const api = functions.https.onRequest(app);
