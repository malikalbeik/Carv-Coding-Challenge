import * as functions from "firebase-functions";
import {CreateEventPayload} from "../../model/create-event-payload";
import {db} from "../../helpers/fb";
import {v4 as uuidv4} from "uuid";

const MAX_BATCH_SIZE = 500;

export const createEventHttps = functions.https.onRequest(
  async (request, response) => {
    const firebaseDb = db();
    if (request.method !== "POST") {
      response.status(405)
        .json({"error": `Method Not Allowed: ${request.method}`});
      return;
    }

    const payload: CreateEventPayload = request.body;

    // Validate the payload
    if (!payload || !isValidCreateEventPayload(payload)) {
      response.status(400).json({"error": "Invalid payload"});
      return;
    }

    try {
      const eventRef = firebaseDb.collection("events").doc();
      const eventId = eventRef.id;

      // Start creating the event with a batch
      const initialBatch = firebaseDb.batch();
      initialBatch.set(eventRef, {
        id: eventId,
        name: payload.name,
        description: payload.description,
        startTime: new Date(payload.startTime),
        endTime: new Date(payload.endTime),
        availableTickets: payload.availableTickets,
        ticketsPrice: payload.ticketsPrice,
      });

      // Commit the initial event creation
      await initialBatch.commit();

      // Now create tickets in batches
      const ticketsRef = eventRef.collection("tickets");
      let ticketCounter = 0;

      while (ticketCounter < payload.availableTickets) {
        const batch = firebaseDb.batch();
        const remainingTickets = payload.availableTickets - ticketCounter;
        const batchSize = Math.min(MAX_BATCH_SIZE, remainingTickets);

        for (let i = 0; i < batchSize; i++) {
          const ticketId = uuidv4();
          const ticketRef = ticketsRef.doc(ticketId);
          batch.set(ticketRef, {
            id: ticketId,
            event_id: eventId,
            price: payload.ticketsPrice,
            status: "Available",
          });
        }

        // Commit each batch and increment the counter
        await batch.commit();
        ticketCounter += batchSize;
      }

      // Send a success response with the event ID
      response.status(201).json({"eventId": eventId});
    } catch (error) {
      console.error("Error creating event:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);

/**
 * Validates the CreateEventPayload object.
 * @param {CreateEventPayload} payload - The payload to validate.
 * @return {boolean} True if the payload is valid, false otherwise.
 */
function isValidCreateEventPayload(payload: CreateEventPayload): boolean {
  return (
    typeof payload.name === "string" && payload.name.trim() !== "" &&
    typeof payload.description === "string" &&
    payload.description.trim() !== "" &&
    typeof payload.startTime === "string" &&
    !isNaN(Date.parse(payload.startTime)) &&
    typeof payload.endTime === "string" &&
    !isNaN(Date.parse(payload.endTime)) &&
    typeof payload.availableTickets === "number" &&
    payload.availableTickets > 0 &&
    typeof payload.ticketsPrice === "number" && payload.ticketsPrice >= 0
  );
}
