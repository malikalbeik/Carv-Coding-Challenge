# Helpers

This directory contains helper functions and constants used throughout the Firebase Functions project.

## Contents

1. `constants.ts`: Defines constant values, such as Pub/Sub topic names.
2. `fb.ts`: Initializes and provides access to Firebase Admin SDK and Firestore.
3. `retry-checks.ts`: Contains utility functions for handling event retries and age checks.

## Usage

These helpers are imported and used in various parts of the project to promote code reusability and maintain consistency across different functions.

### Examples:

- `constants.ts` is used to define Pub/Sub topic names, which are then used in the Pub/Sub functions.
- `fb.ts` provides a singleton instance of Firestore, ensuring efficient database access across the application.
- `retry-checks.ts` includes the `allowedToExecute` function, which is used in Pub/Sub handlers to prevent processing of outdated events.

Remember to import these helpers as needed in your function files to leverage their functionality.
