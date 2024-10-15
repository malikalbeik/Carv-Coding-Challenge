/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions-test";
import {db} from "../../helpers/fb";
import {PROJECT_ID} from "../../helpers/constants";
import {releaseExpiredTickets} from "./release-expired-holds";
import * as admin from "firebase-admin";

// Test settings and vars
const projectId = PROJECT_ID;
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

const testEnv = functions({
  projectId: projectId,
});

interface Ticket {
    id: string;
    status: string;
    hold_status: boolean;
}

describe("Test releaseExpiredTickets", () => {
  beforeAll(async () => {
    // Clear all Firestore data before running tests
    await testEnv.firestore.clearFirestoreData({projectId});

    // Insert mock event and tickets with holds for testing
    const eventRef = db().collection("events").doc("testEvent");
    const ticketsRef = eventRef.collection("tickets");

    // Insert event
    await eventRef.set({
      id: "testEvent",
      name: "Concert",
      description: "A fun concert event",
      startTime: new Date().toISOString(),
      endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
        .toISOString(), // 2 hours from now
      availableTickets: 100,
      ticketsPrice: 50,
    });

    // Insert tickets with expired holds and active holds
    const now = new Date();
    // 30 minutes ago
    const expiredTimestamp = new Date(now.getTime() - 30 * 60 * 1000);
    // 10 minutes from now
    const activeTimestamp = new Date(now.getTime() + 10 * 60 * 1000);

    const ticketData = [
      {
        id: "ticket1",
        event_id: "testEvent",
        price: 50,
        status: "Onhold",
        hold_status: true,
        hold_expires_at: expiredTimestamp,
      },
      {
        id: "ticket2",
        event_id: "testEvent",
        price: 50,
        status: "Onhold",
        hold_status: true,
        hold_expires_at: activeTimestamp,
      },
    ];

    const batch = db().batch();
    ticketData.forEach((ticket) => {
      const ticketRef = ticketsRef.doc(ticket.id);
      batch.set(ticketRef, {
        ...ticket,
        hold_expires_at: admin.firestore.Timestamp
          .fromDate(ticket.hold_expires_at),
      });
    });

    await batch.commit();
  });

  afterAll(async () => {
    // Clean up any remaining data after tests
    await testEnv.cleanup();
  });

  test("Should release tickets with expired holds", async () => {
    // Call the releaseExpiredTickets function manually
    await releaseExpiredTickets();

    // Fetch the tickets from Firestore
    const ticketsSnapshot = await db().collectionGroup("tickets").get();

    const tickets = ticketsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ticket[];

    // Check the tickets: ticket1 should be released
    // ticket2 should still be on hold
    const ticket1 = tickets.find((ticket) => ticket.id === "ticket1");
    const ticket2 = tickets.find((ticket) => ticket.id === "ticket2");

    expect(ticket1).toBeTruthy();
    expect(ticket1?.status).toBe("Available"); // Should be released
    expect(ticket1?.hold_status).toBe(false);

    expect(ticket2).toBeTruthy();
    expect(ticket2?.status).toBe("Onhold"); // Should still be on hold
    expect(ticket2?.hold_status).toBe(true);
  });

  test("Should log 'No tickets to release' if no expired tickets", async () => {
    // Clear expired tickets for this test
    await testEnv.firestore.clearFirestoreData({projectId});

    const eventRef = db().collection("events").doc("testEvent");
    const ticketsRef = eventRef.collection("tickets");

    const now = new Date();
    // 10 minutes from now
    const activeTimestamp = new Date(now.getTime() + 10 * 60 * 1000);

    const ticketData = [
      {
        id: "ticket1",
        event_id: "testEvent",
        price: 50,
        status: "Onhold",
        hold_status: true,
        hold_expires_at: activeTimestamp,
      },
    ];

    const batch = db().batch();
    ticketData.forEach((ticket) => {
      const ticketRef = ticketsRef.doc(ticket.id);
      batch.set(ticketRef, {
        ...ticket,
        hold_expires_at: admin.firestore.Timestamp
          .fromDate(ticket.hold_expires_at), // Use Firestore timestamp
      });
    });

    await batch.commit();

    // Spy on the console.log to verify the function output
    const logSpy = jest.spyOn(console, "log");

    // Call the function manually
    await releaseExpiredTickets();

    // Ensure the function logged the correct message
    expect(logSpy).toHaveBeenCalledWith("No tickets to release.");
  });
});
