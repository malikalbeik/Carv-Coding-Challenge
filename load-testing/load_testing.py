import aiohttp
import asyncio
import random
import string
from datetime import datetime, timedelta


def generate_random_string(length=5):
    """Generates a random string of given length."""
    letters = string.ascii_letters
    return "".join(random.choices(letters, k=length))


async def create_user(session):
    """Create a random user"""
    user_data = {
        "name": f"User-{generate_random_string()}",
        "email": f"testuser{generate_random_string()}@example.com",
    }
    async with session.post(
        "https://createuserhttps-crw375sxma-uc.a.run.app", json=user_data
    ) as resp:
        return await resp.json(), resp.status


async def create_event(session):
    """Create a random event"""
    event_data = {
        "name": f"Event-{generate_random_string()}",
        "description": "Test Event Description",
        "startTime": datetime.utcnow().isoformat(),
        "endTime": (datetime.utcnow() + timedelta(hours=2)).isoformat(),
        "availableTickets": random.randint(50, 150),
        "ticketsPrice": round(random.uniform(10, 60), 2),
    }
    async with session.post(
        "https://createeventhttps-crw375sxma-uc.a.run.app", json=event_data
    ) as resp:
        return await resp.json(), resp.status


async def get_event_tickets(session, event_id):
    """Fetch event and its tickets"""
    async with session.get(
        f"https://geteventwithticketshttps-crw375sxma-uc.a.run.app?eventId={event_id}"
    ) as resp:
        return await resp.json(), resp.status


async def hold_ticket(session, event_id, ticket_id, user_id):
    """Hold a ticket for the user"""
    hold_data = {"eventId": event_id, "ticketId": ticket_id, "userId": user_id}
    async with session.post(
        "https://holdticket-crw375sxma-uc.a.run.app", json=hold_data
    ) as resp:
        return await resp.json(), resp.status


async def purchase_ticket(session, event_id, ticket_id, user_id):
    """Purchase a ticket"""
    purchase_data = {"eventId": event_id, "ticketId": ticket_id, "userId": user_id}
    async with session.post(
        "https://purchaseeventhttps-crw375sxma-uc.a.run.app", json=purchase_data
    ) as resp:
        response_text = await resp.text()
        return response_text, resp.status


async def simulate_user_flow(session):
    """Simulates the complete user flow for creating user, event, holding and purchasing a ticket"""
    try:
        user_data, user_status = await create_user(session)
        event_data, event_status = await create_event(session)

        if user_status == 201 and event_status == 201:
            event_id = event_data.get("eventId")
            tickets_data, _ = await get_event_tickets(session, event_id)

            # Check if the tickets key is available and if there are tickets
            if (
                tickets_data is None
                or "tickets" not in tickets_data
                or len(tickets_data["tickets"]) == 0
            ):
                print(f"Error: No tickets found for event {event_id}")
                return False

            ticket_id = tickets_data.get("tickets")[0].get("id")
            user_id = user_data.get("userId")

            # Hold ticket
            _, hold_status = await hold_ticket(session, event_id, ticket_id, user_id)

            if hold_status == 200:
                # Purchase ticket
                _, purchase_status = await purchase_ticket(
                    session, event_id, ticket_id, user_id
                )
                return purchase_status == 200
        return False
    except Exception as e:
        print(f"Error in simulate_user_flow: {str(e)}")
        return False


async def simulate_high_load():
    async with aiohttp.ClientSession() as session:
        tasks = []
        for _ in range(1000):  # Adjust this for the number of simultaneous users
            tasks.append(simulate_user_flow(session))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        successful_requests = sum(1 for result in results if result is True)
        print(f"Successful requests: {successful_requests}/{len(tasks)}")


if __name__ == "__main__":
    asyncio.run(simulate_high_load())
