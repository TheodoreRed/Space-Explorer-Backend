import { ObjectId } from "mongodb";
import SpaceArticle from "./SpaceArticle";
import NASAImage from "./NASAImage";
import SpaceEvent from "./SpaceEvent";

interface UserCommentReply {
  uid: string;
  eventId: string;
  content: string;
  createdAt: Date;
  likes: number;
}

interface UserComment {
  uid: string;
  eventId: string;
  content: string;
  createdAt: Date;
  likes: number;
  replies: UserCommentReply[]; // Array of replies to the comment
}

export default interface Account {
  _id?: ObjectId;
  uid: string;
  displayName: string;
  email: string;
  uniqueName: string;
  darkMode: boolean;
  savedEvents: SpaceEvent[];
  savedArticles: SpaceArticle[];
  savedImages: NASAImage[];
  comments: UserComment[];
}
