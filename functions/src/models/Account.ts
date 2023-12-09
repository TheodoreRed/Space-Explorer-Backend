import { ObjectId } from "mongodb";
import SpaceArticle from "./SpaceArticle";
import NASAImage from "./NASAImage";
import SpaceEvent from "./SpaceEvent";

interface UserComment {
  id: string;
  eventId: string;
  content: string;
  createdAt: Date;
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
