import express from "express";
import { ObjectId } from "mongodb";
import { getClient } from "../db";
import Account, { UserComment } from "../models/Account";
import SpaceArticle from "../models/SpaceArticle";
import NASAImage from "../models/NASAImage";

const accountRouter = express.Router();

export const errorResponse = (error: any, res: any) => {
  console.error("FAIL", error);
  res.status(500).json({ message: "Internal Server Error" });
};

// get account by id:
accountRouter.get("/accounts/:uid", async (req, res) => {
  try {
    const uid: string = req.params.uid;
    const client = await getClient();
    const account = await client
      .db()
      .collection<Account>("accounts")
      .findOne({ uid });
    if (account) {
      res.status(200).json(account);
    } else {
      res.status(404).json({ message: "Account Does Not Exist" });
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

// create new Account:
accountRouter.post("/accounts", async (req, res) => {
  try {
    const account: Account = req.body;
    const client = await getClient();
    await client.db().collection<Account>("accounts").insertOne(account);
    res.status(201).json(account);
  } catch (err) {
    errorResponse(err, res);
  }
});

// delete Account by ID:
accountRouter.delete("/accounts/:id", async (req, res) => {
  try {
    const _id: ObjectId = new ObjectId(req.params.id);
    const client = await getClient();
    const result = await client
      .db()
      .collection<Account>("accounts")
      .deleteOne({ _id });
    if (result.deletedCount) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: "Not Found" });
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

// replace / update Account by ID:
accountRouter.put("/accounts/:id", async (req, res) => {
  try {
    const _id: ObjectId = new ObjectId(req.params.id);
    const updatedAccount: Account = req.body;
    delete updatedAccount._id; // remove _id from body so we only have one.
    const client = await getClient();
    const result = await client
      .db()
      .collection<Account>("accounts")
      .replaceOne({ _id }, updatedAccount);
    if (result.modifiedCount) {
      updatedAccount._id = _id;
      res.status(200).json(updatedAccount);
    } else {
      res.status(404).json({ message: "Not Found" });
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

// Toggle space article for a users space article array
accountRouter.patch("/accounts/:id/toggle-article", async (req, res) => {
  const _id: ObjectId = new ObjectId(req.params.id);
  const article: SpaceArticle = req.body;
  try {
    const client = await getClient();
    const account = await client
      .db()
      .collection<Account>("accounts")
      .findOne({ _id });
    if (account?.savedArticles.some((x) => x.id === article.id)) {
      // User is uninterested - remove

      await client
        .db()
        .collection<Account>("accounts")
        .updateOne({ _id }, { $pull: { savedArticles: article } });

      return res.sendStatus(204);
    } else {
      // User has interest! - add

      await client
        .db()
        .collection<Account>("accounts")
        .updateOne({ _id }, { $addToSet: { savedArticles: article } });

      return res.status(200).json({ message: "Article Added successfully" });
    }
  } catch (error) {
    return errorResponse(error, res);
  }
});

// Toggle space image for a users nasa image array
accountRouter.patch("/accounts/:id/toggle-image", async (req, res) => {
  const _id: ObjectId = new ObjectId(req.params.id);
  const image: NASAImage = req.body;
  try {
    const client = await getClient();
    const account = await client
      .db()
      .collection<Account>("accounts")
      .findOne({ _id });
    if (
      account?.savedImages.some(
        (x) => x.data[0].nasa_id === image.data[0].nasa_id
      )
    ) {
      // User is uninterested - remove

      await client
        .db()
        .collection<Account>("accounts")
        .updateOne({ _id }, { $pull: { savedImages: image } });

      return res.sendStatus(204);
    } else {
      // User has interest! - add

      await client
        .db()
        .collection<Account>("accounts")
        .updateOne({ _id }, { $addToSet: { savedImages: image } });

      return res.status(200).json({ message: "Image Added successfully" });
    }
  } catch (error) {
    return errorResponse(error, res);
  }
});

accountRouter.patch(`/accounts/:id/add-comment`, async (req, res) => {
  const _id: ObjectId = new ObjectId(req.params.id);
  const comment: UserComment = req.body;
  try {
    const client = await getClient();

    const result = await client
      .db()
      .collection<Account>("accounts")
      .updateOne({ _id }, { $addToSet: { comments: comment } });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send("Account not found or comment already exists");
    }
    return res.status(200).json({ message: "Success" });
  } catch (error) {
    return errorResponse(error, res);
  }
});

accountRouter.patch("/accounts/:id/delete-comment", async (req, res) => {
  const _id = new ObjectId(req.params.id);
  const commentUuid = req.body.uuid;

  try {
    const client = await getClient();

    const result = await client
      .db()
      .collection("accounts")
      .updateOne({ _id }, { $pull: { comments: { uuid: commentUuid } } });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send("Account not found or comment does not exist");
    }

    res.status(200).send("Comment deleted successfully");
  } catch (error) {
    return errorResponse(error, res);
  }
});

export default accountRouter;
