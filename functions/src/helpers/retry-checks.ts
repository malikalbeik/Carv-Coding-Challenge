import {EventContext} from "firebase-functions/v1";

/**
 * This function checks the age of an event and is used retry events
 * @param {EventContext} event - The event context to check
 * @return {boolean} A boolean indicating whether the event is
 * allowed to execute
 */
export function allowedToExecute(event: EventContext): boolean {
  const eventAge = Date.now() - Date.parse(event.timestamp);
  const eventMaxAge = 30000; // 30 secs

  // Ignore events that are too old
  if (eventAge > eventMaxAge) {
    console.log(`Dropping event ${event} with age ${eventAge} ms.`);
    return false;
  }

  console.log(`Processing event ${event} with age ${eventAge} ms.`);
  return true;
}
