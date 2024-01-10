import { ObjectId } from "mongodb";
import SpaceArticle from "./SpaceArticle";
import NASAImage from "./NASAImage";

export interface UserComment {
  uid: string;
  eventId: string;
  eventDate: string;
  content: string;
  uniqueName: string;
  photoURL: string;
  createdAt: Date;
  likes: string[];
  replies: UserComment[]; // Array of replies to the comment
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
