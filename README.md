# Carv Event Ticketing System

This project implements a comprehensive event ticketing system using Firebase and Google Cloud Platform (GCP) services. It's designed to handle ticket sales, user management, and event organization efficiently and in a scalable manner.

## Project Submission notes

I'm excited to share this project with you! While there's always room for improvement, I'm proud of what I've accomplished given the time constraints.

Balancing this project with my current work commitments was a bit of a challenge, but I tired to make the most of my evenings. I hope you enjoy reviewing it as much as I enjoyed creating it. 

Let me know if you have any questions would be happy to jump on a quick call to discuss this.

Looking forward to joining your team and contributing even more!

## Project Structure

- `functions/`: Contains Firebase Cloud Functions
  - `src/`: Source code for Cloud Functions
    - `https/`: HTTP trigger functions
    - `scheduled/`: Scheduled (cron) functions
    - `pubsub/`: Pub/Sub trigger functions
    - `document/`: Firestore document trigger functions
    - `helpers/`: Utility functions and constants
    - `index.ts`: Main entry point for exporting all functions
  - `README.md`: Detailed information about the Firebase Functions structure

- `terraform/`: Terraform configuration for infrastructure setup
  - `main.tf`: Primary Terraform configuration file
  - `variables.tf`: Variable definitions
  - `outputs.tf`: Output definitions
  - `assets/`: Additional files for infrastructure setup
  - `README.md`: Instructions for Terraform setup and usage

- `architecture/`: System architecture documentation
  - `data-model.d2`: Detailed view of the data model
  - `overall-architecture.d2`: Overview of the system architecture

## Key Features

1.	Event Creation and Management: Easily create and manage events with automated ticket generation.
2.	Ticket Sales and Inventory Management: Keep track of available and sold tickets with real-time updates.
3.	User Registration and Authentication: Secure user authentication using Firebase Authentication.
4.	Transactional Purchase Processing: Ensure data consistency during user purchases.
5.	Automated Scheduled Tasks: Automatically release held tickets using scheduled tasks.
6.	Real-time Updates: Use Firestore to reflect real-time updates on event and ticket status.

## Continuous Integration & Continuous Deployment (CI/CD)

- **GitHub Actions**: Automates the process of deploying infrastructure and code changes. Upon each push, the pipeline validates the infrastructure changes via Terraform, runs tests, and deploys Cloud Functions to Firebase.
- **Terraform**: Manages GCP resources, such as Firestore, Firebase, Pub/Sub topics, and scheduled tasks. All resources are version-controlled and can be easily updated via the CI/CD pipeline.
- **Firebase CLI**: Used within the CI/CD pipeline to deploy the latest Firebase functions and rules, ensuring a seamless deployment experience for both infrastructure and cod

This setup while definetly can be improved makes it easy to do deployments and create multiple instances of this project when needed.


## System Design

### Transaction Management for High-Traffic Events

The system is designed to handle high volumes of ticket sales with transactional integrity using Firestore transactions and Pub/Sub:

- **Pub/Sub Integration**: The Pub/Sub model decouples the purchase process, allowing the system to handle large user loads attempting to purchase tickets simultaneously. When a purchase is initiated, the ticket status is updated asynchronously, ensuring that users do not directly compete for the same tickets in real time.
- **Ticket Locking Mechanism**: When a user attempts to purchase a ticket, it is locked for a certain period (e.g., 20 minutes) to ensure that no other user can buy the same ticket during that time. If the user does not complete the purchase within the lock period, the ticket is released back to the pool automatically through a scheduled function.
- **Firestore Transactions**: The purchase process uses Firestore transactions to ensure data consistency. During the transaction, the ticket status is updated, and a purchase record is created in the user’s profile. If any part of the process fails, the transaction is rolled back, ensuring data integrity.

This architecture ensures that the system can handle large spikes in user traffic and manage race conditions effectively, while keeping user data and ticket inventory consistent.

## Assumptions Made

1. There is no need to do firebase auth or any kind of auth.
2. No need to develope the email sending mechanism. I put a logger there instead.
3. Tickets are locked for 20 minutes and then released +-2 minutes.

## Potential Improvements

1. Setup a more complex CI/CD:
    - A multi-stage pipline that would ensure needed approvals are there before deploying for example after `terraform plan` and before `terraform apply`
    - Add the testing in the CI/CD to be able to fail deployments if tests are failing
2. Standardize API responses: Unify response formats (e.g., to JSON) across all endpoints for improved consistency and usability.
3. Auth + Security: All of these are public functions right now and this is not very good practice. Maybe implement Appchecks for example.
4. Serve the http functions through a centralized function instead of one function for each endpoint
5. More tests: while I have lots of tests there are somethings that i wasn't able to test with the time provided. Things like pubsub triggers.
6. Add a way to know who bought which ticket without querying the purchases (or add an index for the purchases based on the ticket/event id.)


## Getting Started

1. Clone the repository
2. Set up Firebase project and GCP credentials
3. Follow the README in the `terraform/` directory to set up the infrastructure
4. Navigate to the `functions/` directory and run `npm install`
5. `firebase emulators:start` to emulate the functions and test them locally
6. To deploy the functions use `firebase deploy --only functions`

## Testing

Run `npm run test` in the `functions/` directory. Test coverage information can be found in `coverage/lcov.info`.

##  API Documentation & Endpoints

Each endpoint manages different functionalities related to events, tickets, and users.

### holdTicket

**Description**: This endpoint puts a ticket on hold for the specified user for 20 minutes, ensuring no one else can purchase it during this time.

- Method: POST
- URL: https://holdticket-crw375sxma-uc.a.run.app
- Request Body:

    ```json
    {
        "ticketId": "string",
        "eventId": "string",
        "userId": "string"
    }
    ```


- Response: Success or error message based on ticket hold status.

### listEventsHttps

**Description**: Lists all events with pagination support. You can specify the number of events to return (limit) and paginate results using the startAfter parameter.

- Method: GET
- URL: https://listeventshttps-crw375sxma-uc.a.run.app?limit={limit}&startAfter={startAfter}
- Query Parameters:
    - limit: Number of events to retrieve (default: 10).
    - startAfter: Event ID to start after (used for pagination).
- Response: A list of events with metadata and pagination information.

### getEventWithTicketsHttps

**Description**: Fetches a specific event and all its associated tickets by providing the eventId.

- Method: GET
- URL: https://geteventwithticketshttps-crw375sxma-uc.a.run.app?eventId={eventId}
- Query Parameters:
- eventId: The ID of the event to fetch.
- Response: Event details along with a list of tickets associated with the event.

### createEventHttps

**Description**: Creates an event with the specified number of tickets. Each available ticket is generated during the creation process.

- Method: POST
- URL: https://createeventhttps-crw375sxma-uc.a.run.app
- Request Body:

    ```json
    {
        "name": "string",
        "description": "string",
        "startTime": "ISO 8601 date string",
        "endTime": "ISO 8601 date string",
        "availableTickets": "number",
        "ticketsPrice": "number"
    }
    ```


	•	Response: Event creation success or failure message.

### createUserHttps

**Description**: Creates a new user in the system with the provided name and email.

- Method: POST
- URL: https://createuserhttps-crw375sxma-uc.a.run.app
- Request Body:

    ```json
    {
        "name": "string",
        "email": "string"
    }
    ```

- Response: Success or failure message indicating user creation status.

### cancelTicketHttp

**Description**: Cancels a purchased ticket. The ticket must already be purchased before it can be canceled.

- Method: POST
- URL: https://canceltickethttp-crw375sxma-uc.a.run.app
- Request Body:

    ```json
    {
        "eventId": "string",
        "ticketId": "string",
        "userId": "string"
    }
    ```

- Response: Success or failure message indicating whether the ticket was successfully canceled.

### purchaseEventHttps

**Description**: Initiates a ticket purchase by placing a purchase request in the Pub/Sub queue. The ticket must be locked for the user before calling this endpoint.

- Method: POST
- URL: https://purchaseeventhttps-crw375sxma-uc.a.run.app
- Request Body:

    ```json
    {
        "eventId": "string",
        "ticketId": "string",
        "userId": "string"
    }
    ```


- Response: Success message indicating the event was placed in the Pub/Sub queue for purchase processing.

These endpoints allow you to fully manage events, tickets, and users in the Carv Event Ticketing System. For load testing purposes, you can automate requests to these endpoints using a tool like JMeter, Locust, or any HTTP load testing framework of your choice.