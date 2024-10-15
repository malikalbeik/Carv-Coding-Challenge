/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions-test";
import {db} from "../../helpers/fb";
import {PROJECT_ID} from "../../helpers/constants";
import {createUserHttps} from "./create-user-https";

// Test settings and vars
const projectId = PROJECT_ID;
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

const testEnv = functions({
  projectId: projectId,
});

describe("Test createUserHttps", () => {
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

    await createUserHttps(req, res);

    const {responseStatus, response} = res.getResponse();
    expect(responseStatus).toBe(405);
    expect(response).toEqual({error: "Method Not Allowed: GET"});
  });

  test("Should return status 400 if payload is invalid", async () => {
    const req: any = {
      method: "POST",
      body: {
        // Invalid payload with missing required fields (name and email)
      },
    };

    const res = mockRes();

    await createUserHttps(req, res);

    const {responseStatus, response} = res.getResponse();
    expect(responseStatus).toBe(400);
    expect(response).toEqual({error: "Invalid payload"});
  });

  test("Should create user in Firestore", async () => {
    const req: any = {
      method: "POST",
      body: {
        name: "John Doe",
        email: "john.doe@example.com",
      },
    };

    const res = mockRes();

    await createUserHttps(req, res);

    const {responseStatus, response} = res.getResponse();
    expect(responseStatus).toBe(201); // Ensure the response status is 201

    // Type guard to ensure `response` is not undefined
    if (response && response.userId) {
      // Validate that the user was created in Firestore
      const userSnapshot = await db().collection("users")
        .doc(response.userId).get();
      expect(userSnapshot.exists).toBeTruthy();

      const userData = userSnapshot.data();
      expect(userData).toEqual({
        id: response.userId,
        name: "John Doe",
        email: "john.doe@example.com",
        purchases: [], // Empty list of purchases
      });
    } else {
      fail("response.userId is undefined");
    }
  });
});
