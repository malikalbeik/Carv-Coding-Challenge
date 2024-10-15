/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions-test";
import {db} from "../../helpers/fb";
import {conditionCheck} from "../../helpers/utils";
import {PROJECT_ID} from "../../helpers/constants";
import {purchaseEventHttps} from "./purchase-event-https";

// test settings and vars
const projectId = PROJECT_ID;
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.PUBSUB_EMULATOR_HOST = "localhost:8085";

const testEnv = functions({
  projectId: projectId,
});

describe("Test purchaseEventHttps", () => {
  beforeAll(async () => {
    // Clear all data
    await testEnv.firestore.clearFirestoreData(projectId);
  });

  test("Should return status 450 if other than POST", async () => {
    let response;
    let responseStatus;
    const res: any = {
      send: (resp: string) => {
        response = resp;
      },
      status: (status: number) => {
        responseStatus = status;
        return {
          send: (resp: string) => {
            response = resp;
          },
        };
      },
    };

    const req: any = {
      method: "GET",
      body: {
        eventId: "testEvent",
      },
    };
    const spy = jest.spyOn(res, "status");
    await purchaseEventHttps(req, res);

    expect(spy).toHaveBeenCalled();
    expect(responseStatus).toBe(450);
    expect(response).not.toBeUndefined();
    expect(response).not.toBeNull();
  });

  test("Should return status 412 if missing item in payload", async () => {
    let response;
    let responseStatus;
    const res: any = {
      send: (resp: string) => {
        response = resp;
      },
      status: (status: number) => {
        responseStatus = status;
        return {
          send: (resp: string) => {
            response = resp;
          },
        };
      },
    };

    const req: any = {
      method: "POST",
      body: {
      },
    };
    const spy = jest.spyOn(res, "status");
    await purchaseEventHttps(req, res);

    expect(spy).toHaveBeenCalled();
    expect(responseStatus).toBe(412);
    expect(response).not.toBeUndefined();
    expect(response).not.toBeNull();
  });

  test("Test record is written", async () => {
    let response;
    let responseStatus;
    const res: any = {
      send: (resp: string) => {
        response = resp;
      },
      status: (status: number) => {
        responseStatus = status;
        return {
          send: (resp: string) => {
            response = resp;
          },
        };
      },
    };

    const req: any = {
      method: "POST",
      body: {
        eventId: "testEventId",
        ticketId: "testTicketId",
        userId: "tesTuserId",
      },
    };
    const spy = jest.spyOn(res, "status");
    await purchaseEventHttps(req, res);

    expect(spy).toHaveBeenCalled();
    expect(response).toBe("Msg Sent");
    expect(responseStatus).toBe(200);
    let snapshot: FirebaseFirestore.QuerySnapshot | undefined;

    const timedOut = await conditionCheck(async () => {
      // Check purchase happened
      snapshot = await db().collection("Users").get();
      return snapshot.docs.length === 1;
    }, 3000);


    if (!timedOut && snapshot) {
      expect(snapshot.docs.length).toBe(1);
      const data = snapshot.docs[0].data();
      expect(data.item).toBe("testItem");
    } else {
      fail("Trigger timed out");
    }
  });
});
