import express from "express";
import axios from "axios";
import { getClient } from "../db";
import SpaceEvent from "../models/SpaceEvent";
import { errorResponse } from "./accountsRouter";
import { ObjectId } from "mongodb";

const spaceDevsRouter = express.Router();

// Enhanced fetchSpaceEvents with backoff mechanism
const fetchSpaceEvents = async (retryCount = 0): Promise<SpaceEvent[]> => {
  try {
    const response = await axios.get(
      "https://ll.thespacedevs.com/2.0.0/event/upcoming/?limit=50&offset=0",
      { timeout: 90000 }
    );
    return response.data.results;
  } catch (error) {
    console.error("Error fetching space events:", error);
    if (retryCount < 3) {
      // Retry up to 3 times
      const waitTime = 900000 * (retryCount + 1); // 15, 30, 45 minutes
      console.log(`Retrying in ${waitTime / 60000} minutes...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return fetchSpaceEvents(retryCount + 1);
    } else {
      throw new Error("Max retries reached");
    }
  }
};

// Database update logic
const updateDatabase = async () => {
  console.log("UPDATED THE DATABASE AT", new Date());
  try {
    const spaceEvents = await fetchSpaceEvents();
    if (spaceEvents) {
      const client = await getClient();
      for (const event of spaceEvents) {
        const query = { id: event.id };
        const update = { $set: event };
        const options = { upsert: true };
        event.interested = 0;
        event.comments = [];
        await client
          .db()
          .collection<SpaceEvent>("SpaceEvents")
          .updateOne(query, update, options);
      }
    }
  } catch (error) {
    console.error("Error updating database with space events:", error);
  }
};

setInterval(updateDatabase, 1200000); // 20 minutes

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

spaceDevsRouter.get(`/:id`, async (req, res) => {
  const _id = new ObjectId(req.params.id);
  try {
    const client = await getClient();
    const event = await client
      .db()
      .collection<SpaceEvent>("SpaceEvents")
      .findOne({ _id });

    if (!event) {
      return res.status(404).json({ message: "Space event not found" });
    }

    return res.status(200).json(event);
  } catch (error) {
    return errorResponse(error, res);
  }
});

export default spaceDevsRouter;
