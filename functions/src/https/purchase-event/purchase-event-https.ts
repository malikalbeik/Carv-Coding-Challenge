import * as functions from 'firebase-functions';
import { PurchaseEventMessage } from '../../model/purchase-event-message';
import { PurchaseEventPubSubClient } from '../../pubsub/event/purchase-event-pub-sub-client';


export const purchaseEventHttps = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
        response.status(450).send(`Invalid method ${request.method}`);
        return;
    }

    if (!(typeof request.body.item === 'string') || request.body.item.length === 0) {
        response.status(412).send(`Missing payload  ${request.body}`);
        return;
    }

    const purchaseEventPubSubClient = new PurchaseEventPubSubClient();
    const PurchaseEventMessage: PurchaseEventMessage = {
        eventId: request.body.eventId,
        ticketId: request.body.ticketId,
        userId: request.body.userId,
    }

    await purchaseEventPubSubClient.sendMessage(PurchaseEventMessage);
    response.status(200).send('Msg Sent');
});