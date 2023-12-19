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
      "https://ll.thespacedevs.com/2.0.0/event/upcoming/?limit=150&offset=0",
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
          .collection<SpaceEvent>("spaceEvents")
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

//updateDatabase();

let requestCount = 0;
let lastRequestTime = Date.now();

spaceDevsRouter.get("/trigger-update", async (req, res) => {
  const currentTime = Date.now();
  const oneHour = 60 * 60 * 1000; // One hour in milliseconds

  // Reset count if more than an hour has passed since the last request
  if (currentTime - lastRequestTime > oneHour) {
    requestCount = 0;
    lastRequestTime = currentTime;
  }

  // Check if the request limit has been reached
  if (requestCount >= 15) {
    return res.status(429).send("Request limit reached. Try again later.");
  }

  try {
    await updateDatabase();
    requestCount++; // Increment the request count
    return res.status(200).send("Database updated successfully");
  } catch (error) {
    errorResponse(error, res);
    return;
  }
});

spaceDevsRouter.get(`/`, async (req, res) => {
  try {
    const client = await getClient();
    const spaceEvents: SpaceEvent[] = await client
      .db()
      .collection<SpaceEvent>("spaceEvents")
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
      .collection<SpaceEvent>("spaceEvents")
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
spaceDevsRouter.patch("/:_id/interested", async (req, res) => {
  const eventId = new ObjectId(req.params._id);
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
      .collection<SpaceEvent>("spaceEvents")
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

spaceDevsRouter.patch("/:id/add-saved-by/:_id", async (req, res) => {
  const account_id: ObjectId = new ObjectId(req.params._id);
  const spaceEvent_id: ObjectId = new ObjectId(req.params.id);
  try {
    const client = await getClient();
    const result = await client
      .db()
      .collection<SpaceEvent>("spaceEvents")
      .updateOne(
        { _id: spaceEvent_id },
        { $addToSet: { savedBy: account_id } }
      );
    if (result.matchedCount) {
      res.status(200).send("Space Event updated successfully.");
    } else {
      res.status(404).send("Space Event not found or no update required.");
    }
  } catch (error) {
    errorResponse(error, res);
  }
});

export default spaceDevsRouter;
