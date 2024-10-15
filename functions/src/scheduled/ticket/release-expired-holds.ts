import * as admin from "firebase-admin";
import {db} from "../../helpers/fb";
import {onSchedule} from "firebase-functions/v2/scheduler";


// Release tickets every 2 minutes if their hold has expired
export const releaseExpiredHolds = onSchedule(
  "every 2 minutes", // Schedule to run every 2 minutes
  async () => {
    await releaseExpiredTickets();
  }
);

// This is the core logic that releases expired holds, which can be tested
export const releaseExpiredTickets = async () => {
  const now = admin.firestore.Timestamp.now();
  const ticketsRef = db()
    .collectionGroup("tickets")
    .where("hold_status", "==", true)
    .where("hold_expires_at", "<", now);

  try {
    const ticketsSnapshot = await ticketsRef.get();

    if (ticketsSnapshot.empty) {
      console.log("No tickets to release.");
      return;
    }

    // Batch to update tickets
    let batch = db().batch();
    let counter = 0;
    const MAX_BATCH_SIZE = 500;

    ticketsSnapshot.forEach((ticketDoc) => {
      batch.update(ticketDoc.ref, {
        hold_status: false,
        holding_user_id: null,
        status: "Available",
        hold_expires_at: null,
      });

      counter++;

      // Commit the batch if the batch size exceeds Firestore limit (500)
      if (counter >= MAX_BATCH_SIZE) {
        batch.commit();
        batch = db().batch(); // Start a new batch
        counter = 0;
      }
    });

    // Commit any remaining updates that didn't reach the batch size limit
    if (counter > 0) {
      await batch.commit();
    }

    console.log(`Released holds on ${ticketsSnapshot.size} tickets.`);
  } catch (error) {
    console.error("Error releasing expired holds:", error);
  }
};
