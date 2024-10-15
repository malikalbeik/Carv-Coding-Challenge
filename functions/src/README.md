# Firebase Functions Project Structure

This README provides an overview of the file structure and contents of the Firebase Functions project.

## Directory Structure

- `src/`: Main source directory
  - `https/`: HTTP trigger functions
  - `scheduled/`: Scheduled (cron) functions
  - `pubsub/`: Pub/Sub trigger functions
  - `document/`: Firestore document trigger functions
  - `helpers/`: Utility functions and constants
  - `index.ts`: Main entry point for exporting all functions

## Key Files and Their Purposes

1. `src/index.ts`: 
   - Exports all functions from different categories (HTTP, Scheduled, Pub/Sub, Document triggers)

2. `src/https/index.ts`:
   - Contains HTTP trigger functions, such as user creation

3. `src/scheduled/index.ts`:
   - Contains scheduled (cron) functions

4. `src/pubsub/index.ts`:
   - Contains Pub/Sub trigger functions, including purchase event handling

5. `src/document/ticket-trigger.ts`:
   - Contains Firestore document trigger for ticket sales

6. `src/helpers/`:
   - `fb.ts`: Firebase initialization and database access
   - `constants.ts`: Shared constants
   - `utils.ts`: Utility functions

## Data Model

The project uses Firestore with the following main collections:

- `events`: Stores event information and tickets
- `users`: Stores user information and purchases

For a detailed view of the data model, refer to `architecture/data-model.d2`.

## Testing

Test coverage information can be found in `coverage/lcov.info` after you run `npm run test`.

## Adding New Functions

When adding new functions:
1. Create the function in the appropriate directory (e.g., `https/`, `scheduled/`, etc.)
2. Export the function in the corresponding index file
3. Import and export the function in `src/index.ts`

This structure ensures proper organization and easy deployment of Firebase Functions.
