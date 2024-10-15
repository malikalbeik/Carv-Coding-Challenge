import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {db} from "../../helpers/fb";

export const cancelTicketHttp = functions.https.onRequest(
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send(`Invalid method ${request.method}`);
      return;
    }

    const {eventId, ticketId, userId} = request.body;

    // Validate input
    if (!eventId || !ticketId || !userId) {
      response.status(400).send("Missing eventId, ticketId, or userId");
      return;
    }

    try {
      const result = await db().runTransaction(async (transaction) => {
        const eventRef = db().collection("events").doc(eventId);
        const ticketRef = eventRef.collection("tickets").doc(ticketId);
        const userRef = db().collection("users").doc(userId);
        const purchaseRef = userRef.collection("purchases")
          .where("ticket_id", "==", ticketId)
          .where("event_id", "==", eventId)
          .limit(1);

        // Fetch the purchase and ticket documents
        const purchaseSnapshot = await transaction.get(purchaseRef);
        if (purchaseSnapshot.empty) {
          return {
            success: false,
            status: 404,
            error: "Purchase not found for the specified ticket/event",
          };
        }

        const ticketDoc = await transaction.get(ticketRef);
        if (!ticketDoc.exists || ticketDoc.data()?.status !== "Sold") {
          return {
            success: false,
            status: 400,
            error: "Ticket is not marked as Sold",
          };
        }

        // Mark the ticket as available again
        transaction.update(ticketRef, {
          status: "Available",
        });

        // Mark the purchase as cancelled
        const purchaseDoc = purchaseSnapshot.docs[0].ref;
        transaction.update(purchaseDoc, {
          purchase_status: "Cancelled",
          cancellation_time: admin.firestore.Timestamp.now(),
        });

        console.info(`Ticket ${ticketId} for ${userId} has been cancelled`);
        return {success: true};
      });

      if (result.success) {
        response.status(200).send("Ticket successfully cancelled");
      } else {
        response.status(result.status || 500).send({error: result.error});
      }
    } catch (error) {
      console.error("Error canceling ticket:", error);
      const errorStr = error instanceof Error ? error.message : String(error);
      response.status(500).send(
        "Error canceling ticket: " + errorStr
      );
    }
  }
);
