/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions-test";
import {db} from "../../helpers/fb";
import {PROJECT_ID} from "../../helpers/constants";
import {listEventsHttps} from "./list-events-https";

// Test settings and vars
const projectId = PROJECT_ID;
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

const testEnv = functions({
  projectId: projectId,
});

describe("Test listEventsHttps with pagination", () => {
  beforeAll(async () => {
    // Clear all Firestore data before running tests
    await testEnv.firestore.clearFirestoreData({projectId});

    // Insert mock events for testing
    const eventsRef = db().collection("events");
    const mockEvents = [
      {
        id: "event1",
        name: "Concert",
        description: "A fun concert event",
        startTime: new Date().toISOString(),
        endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
          .toISOString(),
        availableTickets: 100,
        totalTickets: 200,
      },
      {
        id: "event2",
        name: "Tech Conference",
        description: "A conference about the latest in tech",
        startTime: new Date().toISOString(),
        endTime: new Date(new Date().getTime() + 4 * 60 * 60 * 1000)
          .toISOString(), // 4 hours from now
        availableTickets: 200,
        totalTickets: 200,
      },
      {
        id: "event3",
        name: "Art Exhibit",
        description: "A local art exhibit",
        startTime: new Date().toISOString(),
        endTime: new Date(new Date().getTime() + 6 * 60 * 60 * 1000)
          .toISOString(), // 6 hours from now
        availableTickets: 50,
        totalTickets: 200,
      },
    ];

    // Batch insert the events
    const batch = db().batch();
    mockEvents.forEach((event) => {
      const eventRef = eventsRef.doc(event.id);
      batch.set(eventRef, event);
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

  test("Should list all events (default pagination limit)", async () => {
    const req: any = {
      method: "GET",
      query: {},
    };

    const res = mockRes();

    // Call the function
    await listEventsHttps(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check the response
    expect(responseStatus).toBe(200);
    expect(response.events).toHaveLength(3); // Since we added 3 events
    expect(response.events[0].name).toBe("Concert");
  });

  test("Should return paginated results with a limit of 2", async () => {
    const req: any = {
      method: "GET",
      query: {
        limit: "2",
      },
    };

    const res = mockRes();

    // Call the function
    await listEventsHttps(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check the response
    expect(responseStatus).toBe(200);
    expect(response.events).toHaveLength(2); // Limit of 2
    expect(response.events[0].name).toBe("Concert");
    expect(response.events[1].name).toBe("Tech Conference");
    expect(response.nextPageToken).toBeTruthy(); // Should have a nextPageToken
  });

  test("Should return the next page using startAfter token", async () => {
    // Fetch first page with limit 2 to get the nextPageToken
    const firstReq: any = {
      method: "GET",
      query: {
        limit: "2",
      },
    };
    const firstRes = mockRes();
    await listEventsHttps(firstReq, firstRes);
    const {response: firstResponse} = firstRes.getResponse();
    const nextPageToken = firstResponse.nextPageToken;

    // Fetch the next page using the nextPageToken
    const req: any = {
      method: "GET",
      query: {
        limit: "2",
        startAfter: nextPageToken,
      },
    };

    const res = mockRes();

    // Call the function
    await listEventsHttps(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check the response for the next page
    expect(responseStatus).toBe(200);
    expect(response.events).toHaveLength(1); // Only 1 remaining event
    expect(response.events[0].name).toBe("Art Exhibit");
  });

  test("Should return empty array if no events", async () => {
    // Clear the data for this test
    await testEnv.firestore.clearFirestoreData({projectId});

    const req: any = {
      method: "GET",
      query: {},
    };

    const res = mockRes();

    // Call the function
    await listEventsHttps(req, res);

    const {responseStatus, response} = res.getResponse();

    // Check the response
    expect(responseStatus).toBe(200);
    expect(response.events).toHaveLength(0); // No events
  });
});
