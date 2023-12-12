import express from "express";
import axios from "axios";
import { getClient } from "../db";
import SpaceEvent from "../models/SpaceEvent";
import { errorResponse } from "./accountsRouter";

const spaceDevsRouter = express.Router();

const fetchSpaceEvents = async () => {
  try {
    const response = await axios.get(
      "https://ll.thespacedevs.com/2.0.0/event/upcoming/?limit=1000&offset=0",
      { timeout: 10000 }
    );
    return response.data.results;
  } catch (error) {
    console.error("Error fetching space events:", error);
  }
};

setInterval(async () => {
  console.log("UPDATED THE DATABASE AT", new Date());

  const spaceEvents = await fetchSpaceEvents();
  if (spaceEvents) {
    try {
      const client = await getClient();
      await client
        .db()
        .collection<SpaceEvent>("SpaceEvents")
        .insertMany(spaceEvents);
    } catch (error) {
      console.error("Error saving space events:", error);
    }
  }
}, 1200000); // 20 minutes

spaceDevsRouter.get(`/`, async (req, res) => {
  try {
    const client = await getClient();
    const spaceEvents: SpaceEvent[] = await client
      .db()
      .collection<SpaceEvent>("SpaceEvents")
      .find()
      .toArray();

    if (!spaceEvents) {
      res.status(404).json({ message: "Failed to GET all space events" });
    }
    res.status(200).json(spaceEvents);
  } catch (error) {
    errorResponse(error, res);
  }
});

export default spaceDevsRouter;
