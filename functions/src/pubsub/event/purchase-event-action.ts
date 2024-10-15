import * as admin from "firebase-admin";
// import { HttpsError } from 'firebase-functions/lib/v1/providers/https';
import {Message} from "firebase-functions/lib/v1/providers/pubsub";
import {PurchaseEventMessage} from "../../model/purchase-event-message";

/**
 * Handles processing and sending of purchase events.
 * Interacts with Firestore to manage order data.
 */
export class PurchaseEventAction {
  readonly _db: admin.firestore.Firestore;

  /**
   * Creates a new PurchaseEventAction instance.
   * @param {admin.firestore.Firestore} firestore The Firestore instance to use.
   */
  constructor(firestore: admin.firestore.Firestore) {
    this._db = firestore;
  }

  /**
   * Processes and sends a purchase event message.
   * @param {Message} pubSubMessage The message from Pub/Sub to process.
   * @return {Promise<Message>} The processed message.
   */
  async processAndSend(pubSubMessage: Message) {
    return pubSubMessage;
  }

  /**
   * Decodes a base64 encoded message string.
   * @param {string} [dataStr] - The base64 encoded string to decode.
   * @return {PurchaseEventMessage | null} The decoded message or null
   * if invalid.
   */
  decodeMessage(dataStr?: string): PurchaseEventMessage | null {
    // decode the body
    // eslint-disable-next-line max-len
    const messageBody = dataStr ? Buffer.from(dataStr, "base64").toString() : null;

    if (messageBody === null) {
      return null; // exit
    }

    return JSON.parse(messageBody) as PurchaseEventMessage;
  }
}
