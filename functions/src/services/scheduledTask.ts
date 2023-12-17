// Import Firebase functions and admin modules
import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { updateDatabase } from "../routes/spaceDevsRouter";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Scheduled Cloud Function to update database every 20 minutes
export const scheduledSpaceEventUpdate = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    console.log("Scheduled update of space events started");
    try {
      await updateDatabase();
      console.log("Scheduled update of space events completed successfully");
    } catch (error) {
      console.error("Error during scheduled update of space events:", error);
    }
  });
