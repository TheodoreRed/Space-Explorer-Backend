// Main interface representing the structure of a NASA image
export default interface NASAImage {
  data: NASAImageData[]; // An array of NASA image data objects
  links: NASAImageLink[]; // An array of links related to the NASA image
}

// Interface for the data part of a NASA image
interface NASAImageData {
  title: string; // Title of the image or video
  nasa_id: string; // Unique identifier for the image or video
  date_created: string; // Date when the image or video was created
  description: string; // Description of the image or video
  media_type: string; // Type of media, filtered to only include 'image'
  keywords?: string[]; // Optional array of keywords related to the image or video
  center?: string; // Optional NASA center associated with the image or video
  secondary_creator?: string; // Optional secondary creator of the image or video
  description_508?: string; // Optional alternative description for accessibility
}

// Interface for the link part of a NASA image
interface NASAImageLink {
  href: string; // URL of the linked resource
  rel?: string; // Optional relationship type of the link
  render?: string; // Optional rendering hint for how the link should be displayed
}
