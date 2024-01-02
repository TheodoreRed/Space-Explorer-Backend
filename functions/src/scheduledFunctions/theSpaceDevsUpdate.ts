import axios from "axios";
import Spacecraft from "../models/Spacecraft";
import { getClient } from "../db";
import { generateTextWithOpenAI } from "../routes/openAiRouter";
import { Astronaut } from "../models/Astronaut";
import SpaceEvent from "../models/SpaceEvent";

const fetchSpaceCraft = async (
  offset: number
): Promise<Spacecraft[] | undefined> => {
  try {
    const response = await axios.get(
      `https://ll.thespacedevs.com/2.2.0/spacecraft/?limit=100&offset=${offset}`
    );
    return response.data.results;
  } catch (error) {
    console.error("Error fetching spacecraft:", error);
    return;
  }
};

const updateSpacecrafts = async () => {
  console.log("Update of spacecrafts has started...");
  const client = await getClient();

  // Fetch existing spacecrafts from the database
  const existingSpacecrafts = await client
    .db()
    .collection<Spacecraft>("spacecrafts")
    .find()
    .toArray();
  const offset = existingSpacecrafts.length;
  console.log("Offset: ", offset);

  const allSpacecrafts = await fetchSpaceCraft(offset);
  if (allSpacecrafts) {
    console.log("Spacecrafts were fetched.");

    // Create a lookup object
    const existingSpacecraftLookup: any = {};
    existingSpacecrafts.forEach((craft) => {
      existingSpacecraftLookup[craft.id] = craft;
    });

    // Process each spacecraft
    let count = 0;
    for (const spacecraft of allSpacecrafts) {
      let existingSpacecraft: Spacecraft | undefined =
        existingSpacecraftLookup[spacecraft.id];

      if (!existingSpacecraft) {
        count++;

        do {
          spacecraft.keywords = [];
          let keywordsPrompt = `Analyze the following information and identify the top 10 key terms that best summarize the spacecraft's features, mission, and historical significance. The terms should be specific, relevant, and distinct. Present these keywords in a comma-separated list. Name: ${spacecraft.name}, Description: ${spacecraft.description}`;
          let keywordsResult = await generateTextWithOpenAI(keywordsPrompt);
          spacecraft.keywords = keywordsResult
            .split(",")
            .map((keyword) => keyword.trim());
        } while (spacecraft.keywords.length !== 10);

        const query = { id: spacecraft.id };
        const update = { $set: spacecraft };
        const options = { upsert: true };

        await client
          .db()
          .collection<Spacecraft>("spacecrafts")
          .updateOne(query, update, options);
      } else {
        spacecraft.keywords = existingSpacecraft.keywords;
      }
    }
    console.log(`${count} spacecrafts were added and updated successful`);
  } else {
    console.log("Spacecrafts were not fetched!!");
  }
};

const fetchAstronauts = async (
  offset: number
): Promise<Astronaut[] | undefined> => {
  try {
    const response = await axios.get(
      `https://ll.thespacedevs.com/2.2.0/astronaut/?limit=100&offset=${offset}`
    );
    return response.data.results;
  } catch (error) {
    console.error("Error fetching astronauts:", error);
    return;
  }
};

const updateAstronauts = async () => {
  console.log("Update of astronauts has started...");
  const client = await getClient();

  // Fetch existing astronauts from the database
  const existingAstronauts = await client
    .db()
    .collection<Astronaut>("astronauts")
    .find()
    .toArray();
  const offset = existingAstronauts.length;
  console.log(offset);

  const allAstronauts = await fetchAstronauts(offset);
  if (allAstronauts) {
    console.log("Astronauts were fetched.");

    // Create a lookup object
    const existingAstronautLookup: any = {};
    existingAstronauts.forEach((naut) => {
      existingAstronautLookup[naut.id] = naut;
    });

    let count = 0;
    // Process each astronaut
    for (const astronaut of allAstronauts) {
      let existingAstronaut: Astronaut | undefined =
        existingAstronautLookup[astronaut.id];

      if (!existingAstronaut) {
        count++;

        let prompt = `Using the key information provided, create a comprehensive and coherent biography in a single paragraph for the astronaut. Focus on their major achievements, background, and notable contributions to space exploration. Information: Name - ${astronaut.name}, Bio - ${astronaut.bio}. Ensure the biography is factual, concise, and engaging.`;

        astronaut.detailedInfo = await generateTextWithOpenAI(prompt);

        // Extract keywords
        do {
          astronaut.keywords = [];
          let keywordsPrompt = `Analyze the following detailed biography and identify exactly five key terms that best summarize the astronaut's professional achievements and contributions. The terms should be specific, relevant, and distinct. Present these keywords in a comma-separated list. Biography: ${astronaut.detailedInfo}`;

          let keywordsResult = await generateTextWithOpenAI(keywordsPrompt);
          astronaut.keywords = keywordsResult
            .split(",")
            .map((keyword) => keyword.trim());
          astronaut.keywords.push(astronaut.name);
        } while (astronaut.keywords.length !== 6);
      } else {
        astronaut.detailedInfo = existingAstronaut.detailedInfo;
        astronaut.keywords = existingAstronaut.keywords;
      }

      const query = { id: astronaut.id };
      const update = { $set: astronaut };
      const options = { upsert: true };

      await client
        .db()
        .collection<Astronaut>("astronauts")
        .updateOne(query, update, options);
    }
    console.log(`${count} astronauts were added and updated successful`);
  } else {
    console.log("Astronauts were not fetched!!");
  }
};

const fetchSpaceEvents = async (): Promise<SpaceEvent[] | undefined> => {
  try {
    const response = await axios.get(
      "https://ll.thespacedevs.com/2.0.0/event/upcoming/?limit=50"
    );
    return response.data.results;
  } catch (error) {
    console.error("Error fetching space events:", error);
    return;
  }
};

const updateSpaceEvents = async () => {
  console.log("Update of upcoming space events has started...");
  const client = await getClient();

  // Fetch existing space events from the database
  const existingSpaceEvents = await client
    .db()
    .collection<SpaceEvent>("spaceEvents")
    .find()
    .toArray();

  const spaceEvents = await fetchSpaceEvents();
  if (spaceEvents) {
    console.log("Astronauts were fetched.");

    // Create a lookup object
    const existingSpaceEventsLookup: any = {};
    existingSpaceEvents.forEach((spaceE) => {
      existingSpaceEventsLookup[spaceE.id] = spaceE;
    });

    let count = 0;
    // Process each astronaut
    for (const event of spaceEvents) {
      let existingEvent = existingSpaceEventsLookup[event.id];

      if (!existingEvent) {
        event.interested = event.interested ?? 0;
        event.comments = event.comments ?? [];
        event.savedBy = event.savedBy ?? [];
      }

      if (!existingEvent || !existingEvent.detailedInfo) {
        count++;
        let prompt = `Craft a succinct and engaging summary for the following space event, highlighting its significance and key details. Use simple yet compelling language to make it accessible and interesting to website visitors. Event Name: ${event.name}, Description: ${event.description}. Deliver this summary in a single, well-structured paragraph.`;
        event.detailedInfo = await generateTextWithOpenAI(prompt);

        prompt = `Examine the provided event summary and distill it into 10 precise and informative keywords. These keywords should encapsulate the core aspects and unique features of the space event, aiding in effective search and discovery. Ensure they are distinct and directly relevant. Summary: ${event.detailedInfo}. Format the keywords as a comma-separated list.`;
        event.keyWords = (await generateTextWithOpenAI(prompt))
          .split(",")
          .map((keyword) => keyword.trim());
      } else {
        event.detailedInfo = existingEvent.detailedInfo;
        event.keyWords = existingEvent.keyWords;
      }

      const query = { id: event.id };
      const update = { $set: event };
      const options = { upsert: true };

      await client
        .db()
        .collection<SpaceEvent>("spaceEvents")
        .updateOne(query, update, options);
    }
    console.log(`${count} space events were added and updated successful`);
  } else {
    console.log("Space Events were not fetched!!");
  }
};

// Database update logic
export const updateDatabase = async () => {
  console.log("Attempting to update database...", new Date());
  await updateAstronauts();
  await updateSpacecrafts();
  await updateSpaceEvents();
};
