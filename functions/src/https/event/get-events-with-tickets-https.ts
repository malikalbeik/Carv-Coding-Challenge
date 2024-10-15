import * as functions from "firebase-functions";
import {db} from "../../helpers/fb";

// Function to get an event and its related tickets
export const getEventWithTicketsHttps = functions.https.onRequest(
  async (request, response) => {
    const firebaseDb = db();
    const {eventId} = request.query;

    if (!eventId || typeof eventId !== "string") {
      response.status(400).json({error: "Invalid or missing event ID"});
      return;
    }

    try {
      const eventRef = firebaseDb.collection("events").doc(eventId);
      const eventSnapshot = await eventRef.get();

      if (!eventSnapshot.exists) {
        response.status(404).json({error: "Event not found"});
        return;
      }

      const eventData = eventSnapshot.data();

      // Get the tickets related to the event
      const ticketsRef = eventRef.collection("tickets");
      const ticketsSnapshot = await ticketsRef.get();

      const tickets = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Return event and its tickets
      response.status(200).json({
        event: eventData,
        tickets: tickets,
      });
    } catch (error) {
      console.error("Error fetching event and tickets:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);
