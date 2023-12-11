import express from "express";
import axios from "axios";
import { getClient } from "../db";
import SpaceEvent from "../models/SpaceEvent";
import { errorResponse } from "./accountsRouter";

const spaceDevsRouter = express.Router();

// Route to fetch and save space events
spaceDevsRouter.get("/", async (req, res) => {
  try {
    // Fetch data from the third-party API
    const spaceEvents: SpaceEvent[] = (
      await axios.get(
        "https://ll.thespacedevs.com/2.0.0/event/upcoming/?limit=1000&offset=0"
      )
    ).data.results;

    const client = await getClient();
    const response = await client
      .db()
      .collection<SpaceEvent>("SpaceEvents")
      .insertMany(spaceEvents);

    if (response.insertedCount) {
      res
        .status(200)
        .json({ message: "Space events fetched and saved successfully" });
    } else {
      res.status(404).json({ message: "Error fetching Space Events" });
    }
  } catch (error) {
    errorResponse(error, res);
  }
});

export default spaceDevsRouter;
