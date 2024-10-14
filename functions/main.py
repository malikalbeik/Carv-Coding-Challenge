# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

import os
import json
from firebase_functions import https_fn, pubsub_fn
from firebase_admin import initialize_app, firestore

# from google.cloud import pubsub_v1
from models import (
    Event,
    EventTicket,
    User,
    UserPurchase,
    PurchaseEvent,
    CreateEventPayload,
)
from pydantic import ValidationError
import uuid

initialize_app()


EVENTS_COLLECTION_NAME = "events"
TICKETS_COLLECTION_NAME = "tickets"


# TODO: just a test function. Remove later
@https_fn.on_request(region=os.environ["REGION"])
def on_request_example(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response("Hello world!")


@pubsub_fn.on_message_published(
    topic=os.environ["PURCHASE_TOPIC_NAME"], region=os.environ["REGION"]
)
def process_purchase_events(
    purchase_event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData],
) -> None:
    """Log a message using data published to a Pub/Sub topic."""
    try:
        purchase_event_json = purchase_event.data.message.json
    except ValueError:
        # TODO: handle error
        print("PubSub message was not JSON")
        return
    if purchase_event_json is None:
        return
    try:
        # Parse and validate the request data
        purchase_event_data = PurchaseEvent(**purchase_event_json)
    except ValidationError as e:
        return https_fn.Response(f"Invalid event data: {str(e)}", status=400)


@https_fn.on_request(region=os.environ["REGION"])
def create_event(req: https_fn.Request) -> https_fn.Response:
    try:
        # Parse and validate the request data
        event_data = CreateEventPayload(**req.get_json())
    except ValidationError as e:
        return https_fn.Response(e.json(), status=400, mimetype="application/json")

    # Create a Firestore client
    db = firestore.client()

    # Create a new event document in Firestore
    event_ref = db.collection(EVENTS_COLLECTION_NAME).document()

    # Use batch writing to create tickets
    tickets_collection = event_ref.collection(TICKETS_COLLECTION_NAME)
    max_batch_size = 500

    # Split into multiple batches if total_tickets exceed Firestore batch size limit (500)
    for i in range(0, event_data.total_tickets, max_batch_size):
        batch = db.batch()  # Create a new batch for each 500 tickets
        for j in range(i, min(i + max_batch_size, event_data.total_tickets)):
            ticket_id = str(uuid.uuid4())
            ticket_ref = tickets_collection.document(ticket_id)
            batch.set(
                ticket_ref, {"status": "available", "price": event_data.tickets_price}
            )
        batch.commit()  # Commit the batch after each 500 tickets

    # Set the event data in Firestore after all tickets are created
    db.collection(EVENTS_COLLECTION_NAME).document(event_ref.id).set(
        event_data.model_dump()
    )

    return https_fn.Response(
        f"Event created successfully with ID: {event_ref.id}", status=201
    )
