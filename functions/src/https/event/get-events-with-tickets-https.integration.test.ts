/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions-test";
import {db} from "../../helpers/fb";
import {PROJECT_ID} from "../../helpers/constants";
import {getEventWithTicketsHttps} from "./get-events-with-tickets-https";

// Test settings and vars
const projectId = PROJECT_ID;
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

const testEnv = functions({
  projectId: projectId,
});

describe("Test getEventWithTicketsHttps", () => {
  beforeAll(async () => {
    // Clear all Firestore data before running tests
    await testEnv.firestore.clearFirestoreData({projectId});

    // Insert a mock event and its related tickets for testing
    const eventRef = db().collection("events").doc("testEvent");
    const ticketsRef = eventRef.collection("tickets");

    // Insert event
    await eventRef.set({
      id: "testEvent",
      name: "Concert",
      description: "A fun concert event",
      startTime: new Date().toISOString(),
      endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
        .toISOString(),
      availableTickets: 100,
      totalTickets: 100,
    });

    // Insert tickets
    const batch = db().batch();
    const ticketData = [
      {id: "ticket1", event_id: "testEvent", price: 50, status: "Available"},
      {id: "ticket2", event_id: "testEvent", price: 50, status: "Sold"},
    ];

    ticketData.forEach((ticket) => {
      const ticketRef = ticketsRef.doc(ticket.id);
      batch.set(ticketRef, ticket);
    });

    await batch.commit();
  });

  afterAll(async () => {
    // Clean up any remaining data after tests
    await testEnv.cleanup();
  });

  const mockRes = (): any => {
    let response: any;
    let responseStatus: number;

    return {
      status: (status: number) => {
        responseStatus = status;
        return {
          json: (resp: any) => {
            response = resp;
          },
          send: (resp: any) => {
            response = resp;
          },
        };
      },
      getResponse: () => ({response, responseStatus}),
    };
  };

  test("Should return event and related tickets", async () => {
    const req: any = {
      method: "GET",
      query: {
        eventId: "testEvent",
      },
    };

    const res = mockRes();

    // Call the function
    await getEventWithTicketsHttps(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check the response
    expect(responseStatus).toBe(200);
    expect(response.event).toBeTruthy();
    expect(response.event.name).toBe("Concert");
    expect(response.tickets).toHaveLength(2); // There are 2 tickets
    expect(response.tickets[0].status).toBe("Available");
    expect(response.tickets[1].status).toBe("Sold");
  });

  test("Should return 400 if eventId is missing", async () => {
    const req: any = {
      method: "GET",
      query: {}, // No eventId provided
    };

    const res = mockRes();

    // Call the function
    await getEventWithTicketsHttps(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check that it returns an error for missing eventId
    expect(responseStatus).toBe(400);
    expect(response.error).toBe("Invalid or missing event ID");
  });

  test("Should return 404 if event does not exist", async () => {
    const req: any = {
      method: "GET",
      query: {
        eventId: "nonExistentEvent",
      },
    };

    const res = mockRes();

    // Call the function
    await getEventWithTicketsHttps(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check that it returns 404 for non-existent event
    expect(responseStatus).toBe(404);
    expect(response.error).toBe("Event not found");
  });

  test("Should return empty list if event has no tickets", async () => {
    // Insert an event without tickets
    const eventWithoutTicketsRef = db().collection("events").doc("emptyEvent");
    await eventWithoutTicketsRef.set({
      id: "emptyEvent",
      name: "No Ticket Event",
      description: "An event without tickets",
      startTime: new Date().toISOString(),
      endTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000)
        .toISOString(),
      availableTickets: 0,
      totalTickets: 0,
    });

    const req: any = {
      method: "GET",
      query: {
        eventId: "emptyEvent",
      },
    };

    const res = mockRes();

    // Call the function
    await getEventWithTicketsHttps(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check that it returns the event but with no tickets
    expect(responseStatus).toBe(200);
    expect(response.event.name).toBe("No Ticket Event");
    expect(response.tickets).toHaveLength(0); // No tickets
  });
});
