import { ObjectId } from "mongodb";
import SpaceArticle from "./SpaceArticle";
import NASAImage from "./NASAImage";

interface UserCommentReply {
  uid: string;
  eventId: string;
  eventDate: string;
  parentId: string;
  content: string;
  createdAt: Date;
  likes: string[];
  uuid: string;
  uniqueName: string;
  photoURL: string;
}

export interface UserComment {
  uid: string;
  eventId: string;
  eventDate: string;
  content: string;
  uniqueName: string;
  photoURL: string;
  createdAt: Date;
  likes: string[];
  replies: UserCommentReply[]; // Array of replies to the comment
  uuid: string;
}

export default interface Account {
  _id?: ObjectId;
  uid: string;
  displayName?: string;
  email: string;
  uniqueName: string;
  darkMode: boolean;
  savedEvents: ObjectId[];
  savedArticles: SpaceArticle[];
  savedImages: NASAImage[];
  comments: UserComment[];
}
