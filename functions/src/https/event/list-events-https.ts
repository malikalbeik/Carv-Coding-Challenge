import * as functions from "firebase-functions";
import {db} from "../../helpers/fb";

// Function to list events with pagination
export const listEventsHttps = functions.https
  .onRequest(async (request, response) => {
    const firebaseDb = db();

    const limit = parseInt(request.query.limit as string) || 10;
    const startAfter = request.query.startAfter as string;

    try {
      let eventsQuery = firebaseDb.collection("events")
        .orderBy("startTime").limit(limit);

      // If a startAfter value is provided, start the query after this value
      if (startAfter) {
        const lastEventSnapshot = await firebaseDb
          .collection("events").doc(startAfter).get();
        if (lastEventSnapshot.exists) {
          eventsQuery = eventsQuery.startAfter(lastEventSnapshot);
        }
      }

      const eventsSnapshot = await eventsQuery.get();

      if (eventsSnapshot.empty) {
        response.status(200).json({events: [], nextPageToken: null});
        return;
      }

      // Map over the events to extract data
      const events = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Determine if there is a next page
      const lastVisible = eventsSnapshot.docs[eventsSnapshot.docs.length - 1];
      const nextPageToken = lastVisible ? lastVisible.id : null;

      // Return the list of events and the token for the next page (if exists)
      response.status(200).json({
        events,
        nextPageToken,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      response.status(500).send("Internal Server Error");
    }
  });
