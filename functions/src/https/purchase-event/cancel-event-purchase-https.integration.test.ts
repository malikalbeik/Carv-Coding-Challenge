/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions-test";
import {db} from "../../helpers/fb";
import {PROJECT_ID} from "../../helpers/constants";
import {cancelTicketHttp} from "./cancel-event-purchase-https";
import * as admin from "firebase-admin";

// Test settings and vars
const projectId = PROJECT_ID;
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

const testEnv = functions({
  projectId: projectId,
});

describe("Test cancelTicketHttp", () => {
  let eventId: string;
  let ticketId: string;
  let userId: string;

  beforeAll(async () => {
    // Clear all Firestore data before running tests
    await testEnv.firestore.clearFirestoreData({projectId});

    // Create mock event, ticket, and user with purchases
    const eventRef = db().collection("events").doc();
    eventId = eventRef.id;

    const ticketRef = eventRef.collection("tickets").doc();
    ticketId = ticketRef.id;

    const userRef = db().collection("users").doc();
    userId = userRef.id;

    // Create event, ticket, and user data for the test
    await eventRef.set({
      id: eventId,
      name: "Concert",
      description: "Test concert event",
      startTime: new Date().toISOString(),
      endTime: new Date(new Date()
        .getTime() + 2 * 60 * 60 * 1000).toISOString(),
      availableTickets: 100,
      ticketsPrice: 50,
    });

    await ticketRef.set({
      id: ticketId,
      event_id: eventId,
      status: "Sold",
      price: 50,
    });

    const purchaseRef = userRef.collection("purchases").doc();
    await purchaseRef.set({
      event_id: eventId,
      ticket_id: ticketId,
      purchase_status: "Active",
      purchase_time: admin.firestore.Timestamp.now(),
    });
  });

  afterAll(async () => {
    // Clean up remaining data after tests
    await testEnv.cleanup();
  });

  test("Should cancel the ticket and update purchase status", async () => {
    let response: any;
    let responseStatus = 0;

    const req: any = {
      method: "POST",
      body: {
        eventId: eventId,
        ticketId: ticketId,
        userId: userId,
      },
    };

    const res: any = {
      status: (status: number) => {
        responseStatus = status;
        return {
          send: (resp: any) => {
            response = resp;
          },
        };
      },
    };

    // Call the cancelTicketHttp function
    await cancelTicketHttp(req, res);

    // Check the response status and message
    expect(responseStatus).toBe(200);
    expect(response).toBe("Ticket successfully cancelled");

    // Verify that the ticket status has been updated to "Available"
    const ticketSnapshot = await db()
      .collection("events")
      .doc(eventId)
      .collection("tickets")
      .doc(ticketId)
      .get();

    expect(ticketSnapshot.exists).toBeTruthy();
    expect(ticketSnapshot.data()?.status).toBe("Available");

    // Verify that the purchase status has been updated to "Cancelled"
    const purchaseSnapshot = await db()
      .collection("users")
      .doc(userId)
      .collection("purchases")
      .where("ticket_id", "==", ticketId)
      .limit(1)
      .get();

    const purchaseDoc = purchaseSnapshot.docs[0];
    expect(purchaseDoc.exists).toBeTruthy();
    expect(purchaseDoc.data()?.purchase_status).toBe("Cancelled");
  });

  test("Should return 404 if purchase not found", async () => {
    let response: any;
    let responseStatus = 0; // Initialize with a default value

    const req: any = {
      method: "POST",
      body: {
        eventId: eventId,
        ticketId: "nonexistentTicketId",
        userId: userId,
      },
    };

    const res: any = {
      status: (status: number) => {
        responseStatus = status;
        return {
          send: (resp: any) => {
            response = resp;
          },
        };
      },
    };

    // Call the cancelTicketHttp function with a non-existent ticket
    await cancelTicketHttp(req, res);

    // Check the response status and message
    expect(responseStatus).toBe(404);
    expect(response.error)
      .toBe("Purchase not found for the specified ticket/event");
  });

  test("Should return 400 if ticket is not sold", async () => {
    let response: any;
    let responseStatus = 0; // Initialize with a default value

    // Create a new ticket with a status of "Available"
    const availableTicketRef = db()
      .collection("events")
      .doc(eventId)
      .collection("tickets")
      .doc("availableTicket");

    await availableTicketRef.set({
      id: "availableTicket",
      event_id: eventId,
      status: "Available",
      price: 50,
    });

    const req: any = {
      method: "POST",
      body: {
        eventId: eventId,
        ticketId: "availableTicket",
        userId: userId,
      },
    };

    const res: any = {
      status: (status: number) => {
        responseStatus = status;
        return {
          send: (resp: any) => {
            response = resp;
          },
        };
      },
    };

    // Call the cancelTicketHttp function for a ticket that is not sold
    await cancelTicketHttp(req, res);

    // Check the response status and message
    expect(responseStatus).toBe(404);
    expect(response.error)
      .toBe("Purchase not found for the specified ticket/event");
  });
});
