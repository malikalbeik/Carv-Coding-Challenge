import * as functions from "firebase-functions";
import {db} from "../../helpers/fb";

// Define the UserPayload model
interface CreateUserPayload {
    name: string;
    email: string;
}

export const createUserHttps = functions.https.onRequest(
  async (request, response) => {
    const firebaseDb = db();
    if (request.method !== "POST") {
      response.status(405)
        .json({"error": `Method Not Allowed: ${request.method}`});
      return;
    }

    const payload: CreateUserPayload = request.body;

    // Validate the payload
    if (!payload || !isValidCreateUserPayload(payload)) {
      response.status(400).json({"error": "Invalid payload"});
      return;
    }

    try {
      const userRef = firebaseDb.collection("users").doc();
      const userId = userRef.id;

      // Start creating the user document
      const userData = {
        id: userId,
        name: payload.name,
        email: payload.email,
        purchases: [], // Empty list of purchases
      };

      // Commit the user creation
      await userRef.set(userData);

      // Send a success response with the user ID
      response.status(201).json({"userId": userId});
    } catch (error) {
      console.error("Error creating user:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);

/**
 * Validates the CreateUserPayload object.
 * @param {CreateUserPayload} payload - The payload to validate.
 * @return {boolean} True if the payload is valid, false otherwise.
 */
function isValidCreateUserPayload(payload: CreateUserPayload): boolean {
  return (
    typeof payload.name === "string" && payload.name.trim() !== "" &&
        typeof payload.email === "string" &&
        payload.email.trim() !== "" &&
        validateEmail(payload.email)
  );
}

/**
 * Validates the email format.
 * @param {string} email - The email to validate.
 * @return {boolean} True if the email is valid, false otherwise.
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
