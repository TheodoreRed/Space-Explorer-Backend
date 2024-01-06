import express from "express";
import { getClient } from "../db";
import SpaceEvent from "../models/SpaceEvent";
import { errorResponse } from "./accountsRouter";
import { ObjectId } from "mongodb";
import Account, { UserComment } from "../models/Account";
import { Astronaut } from "../models/Astronaut";
import Spacecraft from "../models/Spacecraft";

const spaceDevsRouter = express.Router();

// Get all cached space events from mongo
spaceDevsRouter.get(`/space-events`, async (req, res) => {
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

// Get all cached astroanuts from mongo
spaceDevsRouter.get(`/astronauts`, async (req, res) => {
  try {
    const client = await getClient();
    const astronauts: Astronaut[] = await client
      .db()
      .collection<Astronaut>("astronauts")
      .find()
      .toArray();

    if (!astronauts) {
      return res.status(404).json({ message: "Failed to GET all astronauts" });
    }
    res.status(200).json(astronauts);
  } catch (error) {
    return errorResponse(error, res);
  }
});

// Get all cached spacecrafts from mongo
spaceDevsRouter.get(`/spacecrafts`, async (req, res) => {
  try {
    const client = await getClient();
    const spacecrafts: Spacecraft[] = await client
      .db()
      .collection<Spacecraft>("spacecrafts")
      .find()
      .toArray();

    if (!spacecrafts) {
      return res.status(404).json({ message: "Failed to GET all spacecrafts" });
    }
    res.status(200).json(spacecrafts);
  } catch (error) {
    return errorResponse(error, res);
  }
});

// Get space event by id
spaceDevsRouter.get(`/space-events/:id`, async (req, res) => {
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

// Get astronaut by id
spaceDevsRouter.get(`/astronauts/:id`, async (req, res) => {
  const _id = new ObjectId(req.params.id);
  try {
    const client = await getClient();
    const astronaut = await client
      .db()
      .collection<SpaceEvent>("astronauts")
      .findOne({ _id });

    if (!astronaut) {
      return res.status(404).json({ message: "Astronaut not found" });
    }

    return res.status(200).json(astronaut);
  } catch (error) {
    return errorResponse(error, res);
  }
});

// PATCH route to toggle a user's interest in a SpaceEvent
spaceDevsRouter.patch(
  "/space-events/:eventId/toggle-interest/:userId",
  async (req, res) => {
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
        accountUpdate = { $pull: { savedEvents: eventId } };
      } else {
        // User is interested, add to savedBy and increment interested
        eventUpdate = {
          $push: { savedBy: userId },
          $inc: { interested: 1 },
        };
        accountUpdate = { $addToSet: { savedEvents: eventId } };
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

      if (
        eventResult.modifiedCount === 0 ||
        accountResult.modifiedCount === 0
      ) {
        return res.status(400).json({ message: "No update was made" });
      }

      return res
        .status(200)
        .json({ message: "Space event interest toggled successfully" });
    } catch (error) {
      return errorResponse(error, res);
    }
  }
);

spaceDevsRouter.patch(`/space-events/:id/add-comment`, async (req, res) => {
  const _id: ObjectId = new ObjectId(req.params.id);
  const comment: UserComment = req.body;
  try {
    const client = await getClient();

    const result = await client
      .db()
      .collection<SpaceEvent>("spaceEvents")
      .updateOne({ _id }, { $addToSet: { comments: comment } });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send("Space Event not found or comment already exists");
    }
    return res.status(200).json({ message: "success" });
  } catch (error) {
    return errorResponse(error, res);
  }
});

spaceDevsRouter.patch("/space-events/:id/delete-comment", async (req, res) => {
  const _id = new ObjectId(req.params.id);
  const commentUuid = req.body.uuid;

  try {
    const client = await getClient();

    const result = await client
      .db()
      .collection("spaceEvents")
      .updateOne({ _id }, { $pull: { comments: { uuid: commentUuid } } });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send("Space Event not found or comment does not exist");
    }

    return res.status(200).send("Comment deleted successfully");
  } catch (error) {
    return errorResponse(error, res);
  }
});

spaceDevsRouter.patch(
  `/space-events/:id/toggle-like-comment/:userId`,
  async (req, res) => {
    const eventId = new ObjectId(req.params.id);
    const userId = req.params.userId;
    const commentUuid = req.body.uuid;
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

      const comment = spaceEvent.comments.find((c) => c.uuid === commentUuid);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      let eventUpdate;
      let accountUpdate;
      if (comment.likes.includes(userId)) {
        // User has already liked this comment, so unlike it
        eventUpdate = { $pull: { "comments.$.likes": userId } };
        accountUpdate = { $pull: { "comments.$.likes": userId } };
      } else {
        // User has not liked this comment, so like it
        eventUpdate = { $addToSet: { "comments.$.likes": userId } };
        accountUpdate = { $addToSet: { "comments.$.likes": userId } };
      }

      // Update the SpaceEvent
      await client
        .db()
        .collection<SpaceEvent>("spaceEvents")
        .updateOne({ _id: eventId, "comments.uuid": commentUuid }, eventUpdate);

      // Update the Account - Only if the comment exists in user's account
      await client
        .db()
        .collection<Account>("accounts")
        .updateOne(
          { uid: userId, "comments.uuid": commentUuid },
          accountUpdate
        );
      return res
        .status(200)
        .json({ message: "Comment like status toggled successfully" });
    } catch (error) {
      return errorResponse(error, res);
    }
  }
);

export default spaceDevsRouter;
