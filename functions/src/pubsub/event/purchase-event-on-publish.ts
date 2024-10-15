import * as functions from 'firebase-functions'
import { EVENT_PURCHASE_TOPIC } from '../../helpers/constants';
import { db } from '../../helpers/fb';
import { allowedToExecute } from '../../helpers/retry-checks';
import { PurchaseEventAction } from './purchase-event-action';


export const purchaseEventOnPublish = functions.runWith({ failurePolicy: true }).pubsub
    .topic(EVENT_PURCHASE_TOPIC)
    .onPublish(async (message, context) => {

        functions.logger.info('purchaseEventOnPublish: ', message, context);

        // RETRY CHECK
        if (!allowedToExecute(context)) {
            functions.logger.warn('purchaseEventOnPublish: failed allowedToExecute');
            return; // old do not retry
        }

        // get action class
        const action: PurchaseEventAction = new PurchaseEventAction(db());

        const result = await action.processAndSend(message);

        return result;
    });