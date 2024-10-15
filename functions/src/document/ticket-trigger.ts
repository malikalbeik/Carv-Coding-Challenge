import {db} from "../helpers/fb";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";

export const onTicketSold = onDocumentUpdated(
  "events/{eventId}/tickets/{ticketId}",
  async (event) => {
    const ticketBefore = event.data?.before.data();
    const ticketAfter = event.data?.after.data();

    // Check if the ticket status has changed to 'Sold'
    if (ticketBefore?.status !== "Sold" && ticketAfter?.status === "Sold") {
      const {eventId, ticketId} = event.params;

      console.info(`Ticket ${ticketId} for event ${eventId} has been sold.`);

      try {
        const eventRef = db().collection("events").doc(eventId);
        const eventSnapshot = await eventRef.get();

        if (!eventSnapshot.exists) {
          console.error(`Event ${eventId} does not exist.`);
          return;
        }

        const eventData = eventSnapshot.data();

        // Optional: Perform any further actions here,
        // such as sending a notification
        // to the event organizer, updating analytics, etc.
        console.info(`Ticket sold for event: ${eventData?.name}`);

        // Example: Sending a notification to user (pseudo-code)
        // sendNotification(eventData, `Ticket ${ticketId} sold`);

        return true;
      } catch (error) {
        console.error("Error handling ticket sold event:", error);
        throw new Error("Failed to process ticket sold event");
      }
    } else {
      console.info("Ticket status did not change to 'Sold', skipping trigger.");
    }

    return null;
  }
);
