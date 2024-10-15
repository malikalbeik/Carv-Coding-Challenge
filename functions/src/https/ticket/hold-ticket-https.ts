import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {db} from "../../helpers/fb";

// Hold a ticket for 20 minutes
export const holdTicket = functions.https.onRequest(async (req, res) => {
  const {ticketId, eventId, userId} = req.body;
  const ticketRef = db().collection("events")
    .doc(eventId).collection("tickets").doc(ticketId);

  try {
    await db().runTransaction(async (transaction) => {
      const ticketSnapshot = await transaction.get(ticketRef);
      if (!ticketSnapshot.exists) {
        throw new Error("Ticket does not exist");
      }

      const ticketData = ticketSnapshot.data();
      const now = admin.firestore.Timestamp.now();

      // Check if ticket is available and not on hold
      if (
        ticketData?.status === "Available" &&
        (!ticketData?.hold_status ||
          ticketData.hold_expires_at.toDate() < now.toDate())
      ) {
        // Put ticket on hold for 20 minutes
        const holdExpiresAt = admin.firestore.Timestamp
          .fromDate(new Date(now.toDate().getTime() + 20 * 60 * 1000));
        transaction.update(ticketRef, {
          hold_status: true,
          hold_expires_at: holdExpiresAt,
          status: "Onhold",
          holding_user_id: userId,
        });
      } else {
        throw new Error("Ticket is not available");
      }
    });

    res.status(200).send({message: "Ticket held successfully"});
  } catch (error) {
    console.log("Error holding ticket:", error);
    res.status(400)
      .send({error: error instanceof Error ? error.message : "Unknown error"});
  }
});
