import * as functions from "firebase-functions";
import {PurchaseEventMessage} from "../../model/purchase-event-message";
import {
  PurchaseEventPubSubClient,
} from "../../pubsub/event/purchase-event-pub-sub-client";

export const purchaseEventHttps = functions.https.onRequest(
  async (request, response) => {
    // Validate that the method is POST
    if (request.method !== "POST") {
      response.status(450).send(`Invalid method ${request.method}`);
      return;
    }

    // Validate the request body for required fields
    if (
      !(typeof request.body.eventId === "string") ||
            !(typeof request.body.ticketId === "string") ||
            !(typeof request.body.userId === "string") ||
            request.body.eventId.length === 0 ||
            request.body.ticketId.length === 0 ||
            request.body.userId.length === 0
    ) {
      response.status(412)
        .send(`Missing or invalid payload: ${JSON.stringify(request.body)}`);
      return;
    }

    try {
      // Create a Pub/Sub message object from the request
      const purchaseEventMessage: PurchaseEventMessage = {
        eventId: request.body.eventId,
        ticketId: request.body.ticketId,
        userId: request.body.userId,
      };

      // Instantiate the Pub/Sub client and publish the message
      const purchaseEventPubSubClient = new PurchaseEventPubSubClient();
      await purchaseEventPubSubClient.sendMessage(purchaseEventMessage);

      // Respond with a success message
      response.status(200).send("Message Sent to Pub/Sub");
    } catch (error) {
      console.error("Error publishing message to Pub/Sub:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);
