import {onMessagePublished} from "firebase-functions/v2/pubsub";
import * as admin from "firebase-admin";
import {db} from "../../helpers/fb";
import {EVENT_PURCHASE_TOPIC} from "../../helpers/constants";
import {PurchaseEventMessage} from "../../model/purchase-event-message";

export const purchaseEventOnPublish = onMessagePublished(
  EVENT_PURCHASE_TOPIC,
  async (event) => {
    const message = event.data;

    // Log the received message
    console.info("purchaseEventOnPublish: Received message",
      message.message.data);

    const purchaseEvent: PurchaseEventMessage =
            JSON.parse(Buffer.from(message.message.data, "base64")
              .toString()) as PurchaseEventMessage;

    // Validate that eventId, ticketId, and userId exist in the message
    if (
      !purchaseEvent.eventId ||
            !purchaseEvent.ticketId ||
            !purchaseEvent.userId
    ) {
      console.error("Invalid purchase event message", purchaseEvent);
      return;
    }

    // Start the transaction to mark the ticket as
    // sold and create a purchase record
    try {
      await db().runTransaction(async (transaction) => {
        const eventRef = db().collection("events").doc(purchaseEvent.eventId);
        const ticketRef = eventRef.collection("tickets")
          .doc(purchaseEvent.ticketId);
        const userRef = db().collection("users").doc(purchaseEvent.userId);
        const purchaseRef = userRef.collection("purchases").doc();

        // Fetch the event and ticket document inside the transaction
        const eventDoc = await transaction.get(eventRef);
        const ticketDoc = await transaction.get(ticketRef);

        if (!ticketDoc.exists || ticketDoc.data()?.status !== "Available") {
          // TODO: This is the place to send an email
          // to the customer or if the transaction fails
          throw new Error("Ticket is not available for purchase");
        }

        // Decrement available tickets if the ticket is sold
        const availableTickets = eventDoc.data()?.availableTickets;
        if (availableTickets <= 0) {
          throw new Error("No more available tickets for this event");
        }

        // Mark the ticket as sold
        transaction.update(ticketRef, {
          status: "Sold",
        });

        // Decrement available tickets
        transaction.update(eventRef, {
          availableTickets: admin.firestore.FieldValue.increment(-1),
        });

        // Create the purchase record in the user's purchases subcollection
        transaction.set(purchaseRef, {
          event_id: purchaseEvent.eventId,
          ticket_id: purchaseEvent.ticketId,
          purchase_time: admin.firestore.Timestamp.now(),
          purchase_status: "Active",
        });

        console.info(
          `Ticket ${purchaseEvent.ticketId} sold to ${purchaseEvent.userId}`
        );
      });

      return true;
    } catch (error) {
      console.error("Error processing purchase:", error);
      throw new Error("Failed to process purchase");
    }
  }
);
