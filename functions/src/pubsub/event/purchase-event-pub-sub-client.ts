import {PubSub} from "@google-cloud/pubsub";
import {logger} from "firebase-functions";
import {EVENT_PURCHASE_TOPIC} from "../../helpers/constants";
import {PurchaseEventMessage} from "../../model/purchase-event-message";

/** Client for sending purchase event messages to Pub/Sub */
export class PurchaseEventPubSubClient {
  private pubSub: PubSub;

  /** Creates a new PurchaseEventPubSubClient instance */
  constructor({pubSub = new PubSub()} = {}) {
    this.pubSub = pubSub ?? new PubSub();
  }

  /** Sends a purchase event message to Pub/Sub
   * @param {PurchaseEventMessage} data The purchase event message to send
   * @return {Promise<string>} A promise that resolves to the message ID
   */
  async sendMessage(data: PurchaseEventMessage): Promise<string> {
    logger.info("PurchaseEventPubSubClient.sendMessage: ", data);
    const topic = this.pubSub.topic(EVENT_PURCHASE_TOPIC);
    return await topic.publishJSON(data);
  }
}
