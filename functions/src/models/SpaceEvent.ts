import { ObjectId } from "mongodb";

interface ServiceProvider {
  id: number;
  name: string; // Name of the service provider (e.g., "NASA")
}

interface RocketConfiguration {
  id: number;
  name: string; // Name of the rocket
  full_name: string; // Full name of the rocke
}

interface Rocket {
  id: number;
  configuration: RocketConfiguration;
}

interface Mission {
  id: number;
  name: string; // Name of the mission
  description: string; // Description of the mission
  type: string; // Type of the mission (e.g., "Resupply")
}

interface LaunchPad {
  id: number;
  name: string; // Name of the launch pad
  info_url?: string | null; // URL for more information
  wiki_url: string; // Wikipedia URL for the launch pad
  map_url: string; // Google Maps URL for the launch pad location
  location: LaunchPadLocation; // Location details of the launch pad
  map_image: string; // URL to an image of the launch pad map
  total_launch_count: number; // Total number of launches from this pad
}

interface LaunchPadLocation {
  id: number;
  url: string; // URL for more details about the location
  name: string; // Name of the location (e.g., "Wallops Island, Virginia, USA")
  map_image: string; // URL to an image of the location
}

interface SpaceStation {
  id: number;
  name: string; // Name of the space station
  founded: string;
  description: string; // Description of the space station
  image_url: string; // URL to an image of the space station
  status: Status;
}

interface Agency {
  id: number;
  name: string; // e.g. NASA
  type: string; // Govt, Commercial
}

interface Program {
  id: number;
  name: string; // Name of the program
  description: string; // Description of the program
  image_url: string; // URL to an image of the program
  info_url?: string;
  wiki_url: string;
  agencies: Agency[]; // Agencies involved in the program
}

interface Status {
  id: number;
  name: string;
}

interface Launch {
  id: string;
  name: string; // Name of the launch
  status: Status;
  probability?: number | null; // Probability of launch
  launch_service_provider: ServiceProvider;
  rocket: Rocket; // Rocket used for the launch
  mission: Mission; // Mission details
  pad: LaunchPad; // Launch pad details
  image?: string | null; // URL to an image of the launch
  program: Program[]; // Programs related to the launch
}

interface SpaceEventType {
  id: number;
  name: string;
}

interface Expedition {
  id: number;
  url: string;
  name: string;
  start: string;
  end?: string | null;
  spacestation: SpaceStation;
}

interface SpaceEventCommentReply {
  uid: string;
  displayName: string;
  photoURL?: string;
  comment: string;
  likes: number; // Number of likes for the reply
}

interface SpaceEventComment {
  uid: string;
  displayName: string;
  photoURL?: string;
  comment: string;
  likes: number; // Number of likes for the comment
  replies: SpaceEventCommentReply[]; // Replies to the comment
}

export default interface SpaceEvent {
  _id?: ObjectId;
  id: number;
  name: string; // Name of the event
  type: SpaceEventType; // Type of the event, e.g., "Spacecraft Release"
  description: string; // Detailed description of the event
  location: string; // Location where the event occurs, e.g., "International Space Station"
  news_url?: string | null; // URL to related news
  video_url?: string | null; // URL to a related video
  feature_image?: string | null; // URL to a featured image of the event
  date: string; // The date and time of the event
  launches: Launch[]; // Array of launches related to the event
  expeditions: Expedition[];
  spacestations: SpaceStation[]; // Array of space stations related to the event
  program: Program[]; // Array of programs related to the event
  interested: number;
  comments: SpaceEventComment[];
  savedBy: ObjectId[];
  detailedInfo: string;
  keyWords: string[];
}
