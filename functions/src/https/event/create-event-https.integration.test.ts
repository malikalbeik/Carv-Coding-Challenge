/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions-test";
import {db} from "../../helpers/fb";
import {PROJECT_ID} from "../../helpers/constants";
import {createEventHttps} from "./create-event-https";

// Test settings and vars
const projectId = PROJECT_ID;
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

const testEnv = functions({
  projectId: projectId,
});

describe("Test createEventHttps", () => {
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

  test("Should return status 405 if method is not POST", async () => {
    const req: any = {
      method: "GET",
      body: {},
    };

    const res = mockRes();

    await createEventHttps(req, res);

    const {responseStatus, response} = res.getResponse();
    expect(responseStatus).toBe(405);
    expect(response).toEqual({error: "Method Not Allowed: GET"});
  });

  test("Should return status 400 if payload is invalid", async () => {
    const req: any = {
      method: "POST",
      body: {
        // Missing required fields
      },
    };

    const res = mockRes();

    await createEventHttps(req, res);

    const {responseStatus, response} = res.getResponse();
    expect(responseStatus).toBe(400);
    expect(response).toEqual({error: "Invalid payload"});
  });

  test("Should create event and tickets in Firestore", async () => {
    const req: any = {
      method: "POST",
      body: {
        name: "Test Event",
        description: "Test Description",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        availableTickets: 10,
        ticketsPrice: 20,
      },
    };

    const res = mockRes();

    await createEventHttps(req, res);

    const {responseStatus, response} = res.getResponse();
    expect(responseStatus).toBe(201); // Ensure the response status is 201

    // Type guard to ensure `response` is not undefined
    if (response && response.eventId) {
      // Validate that the event and tickets were created in Firestore
      const eventSnapshot = await db()
        .collection("events")
        .doc(response.eventId)
        .get();
      expect(eventSnapshot.exists).toBeTruthy();

      const ticketsSnapshot = await db()
        .collection("events")
        .doc(response.eventId)
        .collection("tickets")
        .get();
      expect(ticketsSnapshot.size).toBe(10); // Verify the number of tickets
    } else {
      fail("response.eventId is undefined");
    }
  });
});
