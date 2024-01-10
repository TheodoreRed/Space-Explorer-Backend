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

spaceDevsRouter.get(`/spacecrafts/:id`, async (req, res) => {
  const _id = new ObjectId(req.params.id);
  try {
    const client = await getClient();
    const craft = await client
      .db()
      .collection<Spacecraft>("spacecrafts")
      .findOne({ _id });

    if (!craft) {
      return res.status(404).json({ message: "Craft not found" });
    }

    return res.status(200).json(craft);
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

// PATCH route to add a reply to a comment in a SpaceEvent
spaceDevsRouter.patch(
  "/space-events/:eventId/comments/:commentUuid/add-reply",
  async (req, res) => {
    const eventId = new ObjectId(req.params.eventId);
    const commentUuid = req.params.commentUuid;
    const reply: UserComment = req.body.reply;
    //const isReplyToReply = req.query.isReplyToReply;

    if (!reply) {
      return res.status(400).json({ message: "No reply provided" });
    }

    try {
      const client = await getClient();

      const updateResult = await client
        .db()
        .collection<SpaceEvent>("spaceEvents")
        .updateOne(
          { _id: eventId, "comments.uuid": commentUuid },
          { $push: { "comments.$.replies": reply } }
        );

      if (updateResult.modifiedCount === 0) {
        return res
          .status(404)
          .json({ message: "Comment not found or no update made" });
      }

      return res.status(200).json({ message: "Reply added successfully" });
    } catch (error) {
      return errorResponse(error, res);
    }
  }
);

// PATCH route to delete a reply from a comment in a SpaceEvent
spaceDevsRouter.patch(
  "/space-events/:eventId/comments/:commentUuid/delete-reply/:replyUuid",
  async (req, res) => {
    const eventId = new ObjectId(req.params.eventId);
    const commentUuid = req.params.commentUuid;
    const replyUuid = req.params.replyUuid;

    try {
      const client = await getClient();
      const updateResult = await client
        .db()
        .collection<SpaceEvent>("spaceEvents")
        .updateOne(
          { _id: eventId, "comments.uuid": commentUuid },
          { $pull: { "comments.$.replies": { uuid: replyUuid } } }
        );

      if (updateResult.modifiedCount === 0) {
        return res
          .status(404)
          .json({ message: "Reply not found or no update made" });
      }

      return res.status(200).json({ message: "Reply deleted successfully" });
    } catch (error) {
      return errorResponse(error, res);
    }
  }
);

spaceDevsRouter.patch(
  `/space-events/:eventId/toggle-like-reply/:replyUuid/:userId`,
  async (req, res) => {
    const eventId = new ObjectId(req.params.eventId);
    const replyUuid = req.params.replyUuid;
    const userId = req.params.userId;

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

      // Find the comment and reply
      let commentToUpdate: UserComment | undefined;
      let replyToUpdate: UserComment | undefined;
      spaceEvent.comments.forEach((comment) => {
        const foundReply = comment.replies.find(
          (reply) => reply.uuid === replyUuid
        );
        if (foundReply) {
          commentToUpdate = comment;
          replyToUpdate = foundReply;
        }
      });

      if (!commentToUpdate || !replyToUpdate) {
        return res.status(404).json({ message: "Comment or reply not found" });
      }

      let eventUpdate;
      let accountUpdate;
      if (replyToUpdate.likes.includes(userId)) {
        // User has already liked this reply, so unlike it
        eventUpdate = {
          $pull: { "comments.$[comment].replies.$[reply].likes": userId },
        };
        accountUpdate = {
          $pull: { "comments.$[].replies.$[reply].likes": userId },
        };
      } else {
        // User has not liked this reply, so like it
        eventUpdate = {
          $addToSet: { "comments.$[comment].replies.$[reply].likes": userId },
        };
        accountUpdate = {
          $addToSet: { "comments.$[].replies.$[reply].likes": userId },
        };
      }

      // Update the SpaceEvent
      await client
        .db()
        .collection<SpaceEvent>("spaceEvents")
        .updateOne({ _id: eventId }, eventUpdate, {
          arrayFilters: [
            { "comment.uuid": commentToUpdate.uuid },
            { "reply.uuid": replyUuid },
          ],
        });

      // Update the Account - Only if the comment exists in user's account
      await client
        .db()
        .collection<Account>("accounts")
        .updateOne(
          { uid: userId, "comments.uuid": commentToUpdate.uuid },
          accountUpdate,
          {
            arrayFilters: [{ "reply.uuid": replyUuid }],
          }
        );

      return res
        .status(200)
        .json({ message: "Reply like status toggled successfully" });
    } catch (error) {
      return errorResponse(error, res);
    }
  }
);

export default spaceDevsRouter;
