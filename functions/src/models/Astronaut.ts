import { ObjectId } from "mongodb";

interface Status {
  id: number;
  name: string;
}

interface AstronautType {
  id: number;
  name: string;
}

interface Agency {
  id: number;
  name: string;
  description: string;
}

export interface Astronaut {
  _id?: ObjectId;
  id: number;
  name: string;
  status: Status;
  type: AstronautType;
  in_space: boolean;
  time_in_space: string;
  eva_time: string; // Time spent spacewalking
  age: null | number;
  date_of_birth: null | string;
  date_of_death: null | string;
  nationality: string;
  bio: string;
  twitter: null | string;
  instagram: null | string;
  wiki: null | string;
  agency: Agency;
  profile_image: string;
  profile_image_thumbnail: string;
  flights_count: number;
  landings_count: number;
  spacewalks_count: number;
  last_flight: string;
  first_flight: string;
  detailedInfo: string;
  keywords: string[];
}
