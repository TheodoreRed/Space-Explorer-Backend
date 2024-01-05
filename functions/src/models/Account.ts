import { ObjectId } from "mongodb";
import SpaceArticle from "./SpaceArticle";
import NASAImage from "./NASAImage";

interface UserCommentReply {
  uid: string;
  eventId: string;
  parentId: string;
  content: string;
  createdAt: Date;
  likes: number;
  uuid: string;
  displayName: string;
  photoURL: string;
}

export interface UserComment {
  uid: string;
  eventId: string;
  content: string;
  displayName: string;
  photoURL: string;
  createdAt: Date;
  likes: number;
  replies: UserCommentReply[]; // Array of replies to the comment
  uuid: string;
}

export default interface Account {
  _id?: ObjectId;
  uid: string;
  displayName?: string;
  email: string;
  uniqueName?: string;
  darkMode: boolean;
  savedEvents: ObjectId[];
  savedArticles: SpaceArticle[];
  savedImages: NASAImage[];
  comments: UserComment[];
}
