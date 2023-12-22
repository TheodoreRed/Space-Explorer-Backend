import express from "express";
import axios from "axios";
import { getClient } from "../db";
import SpaceEvent from "../models/SpaceEvent";
import { errorResponse } from "./accountsRouter";
import { ObjectId } from "mongodb";
import { generateTextWithOpenAI } from "./openAiRouter";
import Account from "../models/Account";

const spaceDevsRouter = express.Router();

// Enhanced fetchSpaceEvents with backoff mechanism
const fetchSpaceEvents = async (retryCount = 0): Promise<SpaceEvent[]> => {
  try {
    const response = await axios.get(
      "https://ll.thespacedevs.com/2.0.0/event/upcoming/?limit=50",
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

//const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Database update logic
export const updateDatabase = async () => {
  console.log("Attempting to update database...", new Date());
  try {
    const spaceEvents = await fetchSpaceEvents();

    if (spaceEvents) {
      console.log("Space Event were fetched...");
      const client = await getClient();

      // Fetch existing events from the database
      const existingEvents = await client
        .db()
        .collection<SpaceEvent>("spaceEvents")
        .find()
        .toArray();

      // Create a lookup object
      const existingEventsLookup: any = {};
      existingEvents.forEach((event) => {
        existingEventsLookup[event.id] = event;
      });

      // parallel processing using Promise.all()???
      let count = 0;
      // Process each space event
      for (const event of spaceEvents) {
        let existingEvent = existingEventsLookup[event.id];

        if (!existingEvent) {
          event.interested = event.interested ?? 0;
          event.comments = event.comments ?? [];
          event.savedBy = event.savedBy ?? [];
        }

        if (!existingEvent || !existingEvent.detailedInfo) {
          count++; //testing
          let prompt = `Explain the gist of this space event to a user on my website make sure its clear and informative but not too long: ${
            event.name
          } Date:${event.date.slice(0, 10)} Short Description: ${
            event.description
          }. Breakdown the information and Present in a single paragraph.`;
          event.detailedInfo = await generateTextWithOpenAI(prompt);
          prompt = `Give me the top five(5) keywords for searching articles and images from this body of text: ${event.detailedInfo}. No fluff. Present in a comma seperated view format`;
          event.keyWords = (await generateTextWithOpenAI(prompt)).split(",");
        } else {
          event.detailedInfo = existingEvent.detailedInfo;
          event.keyWords = existingEvent.keyWords;
        }

        const query = { id: event.id };
        const update = { $set: event };
        const options = { upsert: true };

        await client
          .db()
          .collection<SpaceEvent>("spaceEvents")
          .updateOne(query, update, options);
      }
      console.log(`${count} space events were added and updated successful`);
    } else {
      console.log("Space Events were not fetched!!");
    }
  } catch (error) {
    console.error("Error updating database with space events:", error);
  }
};

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

// PATCH route to toggle a user's interest in a SpaceEvent
spaceDevsRouter.patch("/:eventId/toggle-interest/:userId", async (req, res) => {
  const eventId = new ObjectId(req.params.eventId);
  const userId = new ObjectId(req.params.userId);

  try {
    const client = await getClient();

    // Retrieve the current state of the SpaceEvent
    const spaceEvent = await client
      .db()
      .collection<SpaceEvent>("spaceEvents")
      .findOne({ _id: eventId });

    if (!spaceEvent) {
      return res.status(404).json({ message: "Space event not found" });
    }

    let eventUpdate;
    let accountUpdate: any;

    if (
      spaceEvent.savedBy.some(
        (person) => person.toString() === userId.toString()
      )
    ) {
      // User is uninterested, remove from savedBy and decrement interested
      eventUpdate = {
        $pull: { savedBy: userId },
        $inc: { interested: -1 },
      };
      accountUpdate = { $pull: { savedEvents: { _id: eventId } } };
    } else {
      // User is interested, add to savedBy and increment interested
      eventUpdate = {
        $push: { savedBy: userId },
        $inc: { interested: 1 },
      };
      accountUpdate = { $addToSet: { savedEvents: spaceEvent } };
    }

    // Update the SpaceEvent
    const eventResult = await client
      .db()
      .collection<SpaceEvent>("spaceEvents")
      .updateOne({ _id: eventId }, eventUpdate);

    // Update the Account
    const accountResult = await client
      .db()
      .collection<Account>("accounts")
      .updateOne({ _id: userId }, accountUpdate);

    if (eventResult.modifiedCount === 0 || accountResult.modifiedCount === 0) {
      return res.status(400).json({ message: "No update was made" });
    }

    return res
      .status(200)
      .json({ message: "Space event interest toggled successfully" });
  } catch (error) {
    return errorResponse(error, res);
  }
});

export default spaceDevsRouter;
