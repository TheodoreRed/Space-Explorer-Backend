export default interface NASAImage {
  data: NASAImageData[]; // Each array will hold one object
  links: NASAImageLink[];
}

interface NASAImageData {
  title: string;
  nasa_id: string;
  date_created: string;
  description: string;
  media_type: string; // I only want image
}

interface NASAImageLink {
  href: string;
}
