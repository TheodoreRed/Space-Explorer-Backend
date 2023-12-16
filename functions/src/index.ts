import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import accountRouter from "./routes/accountsRouter";
import imageDownloadRouter from "./routes/imageDownloadRouter";
import spaceDevsRouter from "./routes/spaceDevsRouter";
import openaiRouter from "./routes/openAiRouter";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", accountRouter);
app.use("/image", imageDownloadRouter);
app.use("/space-events", spaceDevsRouter);
app.use("/chatGPT", openaiRouter);

export const api = functions.https.onRequest(app);
