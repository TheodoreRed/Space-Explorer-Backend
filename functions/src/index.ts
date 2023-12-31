import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import accountRouter from "./routes/accountsRouter";
import imageDownloadRouter from "./routes/imageDownloadRouter";
import spaceDevsRouter from "./routes/spaceDevsRouter";
import openaiRouter from "./routes/openAiRouter";
import { updateDatabase } from "./scheduledFunctions/theSpaceDevsUpdate";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", accountRouter);
app.use("/image", imageDownloadRouter);
app.use("/", spaceDevsRouter);
app.use("/chatGPT", openaiRouter);

exports.scheduledSpaceEventUpdateDatabase = functions.pubsub
  .schedule("*/20 * * * *")
  .onRun(() => {
    updateDatabase();
  });

export const api = functions.https.onRequest(app);
