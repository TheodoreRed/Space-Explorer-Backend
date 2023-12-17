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
      "https://ll.thespacedevs.com/2.0.0/event/?limit=100&offset=0",
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
export const updateDatabase = async () => {
  console.log("Attempting to update database...", new Date());
  try {
    const spaceEvents = await fetchSpaceEvents();

    if (spaceEvents) {
      console.log("Space Event were fetched...");
      const client = await getClient();
      for (const event of spaceEvents) {
        const query = { id: event.id };
        const update = { $set: event };
        const options = { upsert: true };
        event.interested = event.interested ?? 0;
        event.comments = event.comments ?? [];
        event.savedBy = event.savedBy ?? [];
        await client
          .db()
          .collection<SpaceEvent>("SpaceEvents")
          .updateOne(query, update, options);
      }
      console.log("Space Event Update Successful");
    } else {
      console.log("Space Events were not fetched!!");
    }
  } catch (error) {
    console.error("Error updating database with space events:", error);
  }
};

spaceDevsRouter.get(`/`, async (req, res) => {
  try {
    const client = await getClient();
    const spaceEvents: SpaceEvent[] = await client
      .db()
      .collection<SpaceEvent>("SpaceEvents")
      .find()
      .toArray();

    if (!spaceEvents) {
      return res
        .status(404)
        .json({ message: "Failed to GET all space events" });
    }
    res.status(200).json(spaceEvents);
  } catch (error) {
    return errorResponse(error, res);
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

// PATCH route to update 'interested' count of a SpaceEvent
spaceDevsRouter.patch("/:id/interested", async (req, res) => {
  const eventId = new ObjectId(req.params.id);
  const interestedCount = req.body.interested;

  // Validate interestedCount
  if (typeof interestedCount !== "number" || interestedCount < 0) {
    return res
      .status(400)
      .json({ message: "Invalid 'interested' count provided" });
  }

  try {
    const client = await getClient();
    const result = await client
      .db()
      .collection<SpaceEvent>("SpaceEvents")
      .updateOne({ _id: eventId }, { $set: { interested: interestedCount } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Space event not found" });
    }

    return res
      .status(200)
      .json({ message: "Space event updated successfully" });
  } catch (error) {
    return errorResponse(error, res);
  }
});

export default spaceDevsRouter;
