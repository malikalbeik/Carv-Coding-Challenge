/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions-test";
import {db} from "../../helpers/fb";
import {PROJECT_ID} from "../../helpers/constants";
import {holdTicket} from "./hold-ticket-https";
import * as admin from "firebase-admin";

// Test settings and vars
const projectId = PROJECT_ID;
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

const testEnv = functions({
  projectId: projectId,
});

describe("Test holdTicket function", () => {
  beforeAll(async () => {
    // Clear all Firestore data before running tests
    await testEnv.firestore.clearFirestoreData({projectId});
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

  test("Should hold an available ticket for 20 minutes", async () => {
    // Setup test data
    const eventId = "testEvent";
    const ticketId = "testTicket";
    const userId = "testUser";
    const ticketRef = db().collection("events")
      .doc(eventId).collection("tickets").doc(ticketId);

    // Insert a ticket into Firestore
    await ticketRef.set({
      id: ticketId,
      event_id: eventId,
      status: "Available",
      hold_status: false,
      price: 50,
    });

    // Prepare request and response mocks
    const req: any = {
      method: "POST",
      body: {
        ticketId,
        eventId,
        userId,
      },
    };

    const res = mockRes();

    // Call the function
    await holdTicket(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check the response
    expect(responseStatus).toBe(200);
    expect(response).toEqual({message: "Ticket held successfully"});

    // Validate that the ticket is now on hold
    const updatedTicket = await ticketRef.get();
    const ticketData = updatedTicket.data();
    expect(ticketData?.status).toBe("Onhold");
    expect(ticketData?.hold_status).toBe(true);
    expect(ticketData?.holding_user_id).toBe(userId);
  });

  test("Should return 400 if ticket does not exist", async () => {
    const req: any = {
      method: "POST",
      body: {
        ticketId: "nonExistentTicket",
        eventId: "nonExistentEvent",
        userId: "testUser",
      },
    };

    const res = mockRes();

    // Call the function
    await holdTicket(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check that the ticket does not exist
    expect(responseStatus).toBe(400);
    expect(response.error).toBe("Ticket does not exist");
  });

  test("Should return 400 if ticket is already on hold", async () => {
    // Setup test data
    const eventId = "anotherEvent";
    const ticketId = "alreadyHeldTicket";
    const userId = "testUser";
    const ticketRef = db().collection("events")
      .doc(eventId).collection("tickets").doc(ticketId);

    // Insert a ticket that is already on hold
    await ticketRef.set({
      id: ticketId,
      event_id: eventId,
      status: "Onhold",
      hold_status: true,
      hold_expires_at: admin.firestore.Timestamp
        .fromDate(new Date(Date.now() + 10 * 60 * 1000)), // 10 min
      price: 50,
    });

    // Prepare request and response mocks
    const req: any = {
      method: "POST",
      body: {
        ticketId,
        eventId,
        userId,
      },
    };

    const res = mockRes();

    // Call the function
    await holdTicket(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check that the ticket is already on hold
    expect(responseStatus).toBe(400);
    expect(response.error).toBe("Ticket is not available");
  });
});
