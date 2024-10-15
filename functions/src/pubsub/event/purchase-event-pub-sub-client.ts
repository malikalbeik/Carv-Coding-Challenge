import { PubSub } from "@google-cloud/pubsub";
import { logger } from 'firebase-functions';
import { EVENT_PURCHASE_TOPIC } from "../../helpers/constants";
import { PurchaseEventMessage } from "../../model/purchase-event-message";

export class PurchaseEventPubSubClient {
    private pubSub: PubSub;

    constructor({ pubSub = new PubSub() } = {}) {
        this.pubSub = pubSub ?? new PubSub();
    }

    async sendMessage(data: PurchaseEventMessage): Promise<string> {
        logger.info('PurchaseEventPubSubClient.sendMessage: ', data);
        const topic = this.pubSub.topic(EVENT_PURCHASE_TOPIC);
        return await topic.publishJSON(data);
    }
}