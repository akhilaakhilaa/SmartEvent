from collections import defaultdict
from datetime import datetime, timezone, timedelta
import re
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.event import Event
from app.models.review import Review
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.chatbot import ChatEventCard, ChatMessageResponse


def event_to_card(event: Event) -> ChatEventCard:
    return ChatEventCard(
        id=event.id,
        title=event.title,
        category=event.category,
        location=event.location,
        event_date=event.event_date,
        ticket_price=event.ticket_price,
        available_tickets=event.available_tickets,
        banner_image=event.banner_image,
    )


def extract_location(text: str) -> Optional[str]:
    # Match patterns like "events in hyderabad", "near hyderabad", "in mumbai", etc.
    patterns = [
        r"(?:events?\s+(?:in|near|at))\s+([a-zA-Z\s]+)",
        r"(?:near\s+me)",
        r"(?:in\s+)([a-zA-Z\s]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            group = match.group(0).lower()
            if "near me" in group:
                return "near_me"
            loc = match.group(1).strip()
            # Clean common trailing words
            loc = re.sub(r"\b(this|weekend|today|tomorrow|events?|please)\b", "", loc, flags=re.IGNORECASE).strip()
            if loc:
                return loc
    return None


class ChatbotService:

    @classmethod
    def process_message(
        cls,
        message: str,
        current_user: Optional[User],
        db: Session
    ) -> ChatMessageResponse:
        text = message.strip()
        lower = text.lower()

        # 1. Ticket Help / Issues (check before generic ticket)
        if any(k in lower for k in [
            "ticket issue", "issue with ticket", "trouble with ticket", "cant find ticket",
            "can't find ticket", "lost ticket", "qr code not working", "qr code problem",
            "download ticket", "ticket help", "help with ticket", "ticket support"
        ]):
            return cls._handle_ticket_help(lower)

        # 2. FAQ & Navigation Guidance (how to book, refunds, coupons, wishlist, profile, portals)
        faq_response = cls._handle_faq_navigation(lower)
        if faq_response:
            return faq_response

        # 3. Tickets (User's tickets & passes)
        if any(k in lower for k in ["my ticket", "show my ticket", "view my ticket", "my passes", "my pass", "qr code", "tickets"]):
            return cls._handle_my_tickets(current_user, db)

        # 4. Bookings (User's bookings & reservations)
        if any(k in lower for k in ["booking", "bookings", "reservation", "reservations", "my order"]):
            return cls._handle_my_bookings(current_user, db)

        # 5. Music / Weekend
        if "music" in lower or "concert" in lower or "weekend" in lower:
            return cls._handle_music_weekend(lower, db)

        # 6. Recommendations
        if any(k in lower for k in ["recommend", "suggest", "popular", "trending", "what should i attend", "what to see"]):
            return cls._handle_recommendations(current_user, db)

        # 7. Find Events / Location / Search
        if any(k in lower for k in [
            "near me", "event near", "events in", "find event", "search event",
            "upcoming event", "browse event", "show events", "list events", "what events"
        ]):
            return cls._handle_events_search(lower, db)

        # Fallback for unrecognized questions
        return cls._handle_fallback(lower)


    @classmethod
    def _handle_ticket_help(cls, lower: str) -> ChatMessageResponse:
        reply = (
            "### 🎫 SmartEvent Ticket Assistance\n\n"
            "Here is how to resolve common ticket questions:\n\n"
            "1. **Accessing Digital Tickets:** After your payment is confirmed, your ticket with a secure QR code is automatically generated. You can view all your tickets anytime at the **[My Tickets](/tickets)** page.\n"
            "2. **QR Code Check-in:** Present your QR code on your mobile device or print it out at the event venue. The organizer will scan it for instant verification.\n"
            "3. **Missing or Pending Ticket:** If your account was charged but you don't see a ticket, check your status at **[My Bookings](/bookings)**. If the payment is marked `PENDING`, please allow 1–2 minutes or refresh.\n"
            "4. **Event Changes / Cancellations:** If an organizer updates or cancels an event, you will receive an instant notification in your **[Notifications](/notifications)** center.\n"
            "5. **Need Further Help?** You can find organizer details directly on the event's page to reach out for venue-specific questions."
        )
        return ChatMessageResponse(
            reply=reply,
            intent="ticket_help",
            events=[],
            action="navigate",
            quick_replies=["Show My Tickets", "Show My Bookings", "How to Book", "Trending Events"]
        )

    @classmethod
    def _handle_my_tickets(cls, current_user: Optional[User], db: Session) -> ChatMessageResponse:
        if current_user is None:
            return ChatMessageResponse(
                reply=(
                    "🔒 **Authentication Required**\n\n"
                    "To view your digital tickets and QR codes securely, please log in to your SmartEvent account.\n\n"
                    "Click **[Login](/login)** in the top navigation bar to sign in."
                ),
                intent="my_tickets",
                events=[],
                action="login_required",
                quick_replies=["Login", "Find Events", "Ticket Help"]
            )

        # Authenticated: fetch user's tickets joined through booking
        tickets = (
            db.query(Ticket, Booking, Event)
            .join(Booking, Ticket.booking_id == Booking.id)
            .join(Event, Booking.event_id == Event.id)
            .filter(Booking.user_id == current_user.id)
            .order_by(Ticket.created_at.desc())
            .all()
        )

        if not tickets:
            return ChatMessageResponse(
                reply=(
                    f"Hello **{current_user.username}**, you do not have any active tickets yet.\n\n"
                    "Once you book an upcoming event and complete payment, your digital QR ticket will be generated automatically!"
                ),
                intent="my_tickets",
                events=[],
                action="navigate",
                quick_replies=["Trending Events", "Music This Weekend", "How to Book"]
            )

        ticket_lines = []
        for ticket, booking, event in tickets[:5]:
            ticket_lines.append(
                f"- **{event.title}**\n"
                f"  - 🏷️ Ticket Code: `{ticket.ticket_code}`\n"
                f"  - 📅 Date: {event.event_date.strftime('%b %d, %Y at %I:%M %p')}\n"
                f"  - 📍 Location: {event.location}\n"
                f"  - 🎟️ Quantity: {booking.ticket_quantity} ticket(s) | Status: {booking.booking_status}"
            )

        reply = (
            f"### 🎟️ Your Digital Tickets ({len(tickets)} total)\n\n"
            + "\n\n".join(ticket_lines)
            + f"\n\n👉 You can view and scan your full QR codes on your **[Tickets Page](/tickets)**."
        )

        return ChatMessageResponse(
            reply=reply,
            intent="my_tickets",
            events=[],
            action="navigate",
            quick_replies=["Show My Bookings", "Ticket Help", "Trending Events"]
        )

    @classmethod
    def _handle_my_bookings(cls, current_user: Optional[User], db: Session) -> ChatMessageResponse:
        if current_user is None:
            return ChatMessageResponse(
                reply=(
                    "🔒 **Authentication Required**\n\n"
                    "To view your booking history securely, please log in to your SmartEvent account.\n\n"
                    "Click **[Login](/login)** in the top navigation bar to sign in."
                ),
                intent="my_bookings",
                events=[],
                action="login_required",
                quick_replies=["Login", "Find Events", "Ticket Help"]
            )

        # Authenticated: fetch user's bookings joined with event
        bookings = (
            db.query(Booking, Event)
            .join(Event, Booking.event_id == Event.id)
            .filter(Booking.user_id == current_user.id)
            .order_by(Booking.created_at.desc())
            .all()
        )

        if not bookings:
            return ChatMessageResponse(
                reply=(
                    f"Hello **{current_user.username}**, you don't have any bookings yet.\n\n"
                    "Browse our upcoming events and reserve your seats now!"
                ),
                intent="my_bookings",
                events=[],
                action="navigate",
                quick_replies=["Trending Events", "Music This Weekend", "How to Book"]
            )

        booking_lines = []
        for booking, event in bookings[:5]:
            booking_lines.append(
                f"- **{event.title}** (Booking #{booking.id})\n"
                f"  - 📅 Event Date: {event.event_date.strftime('%b %d, %Y')}\n"
                f"  - 🎫 Quantity: {booking.ticket_quantity} | 💰 Total: ₹{booking.total_price:,.2f}\n"
                f"  - 📌 Status: `{booking.booking_status}`"
            )

        reply = (
            f"### 📋 Your Recent Bookings ({len(bookings)} total)\n\n"
            + "\n\n".join(booking_lines)
            + f"\n\n👉 Manage and review all details on your **[Bookings Page](/bookings)**."
        )

        return ChatMessageResponse(
            reply=reply,
            intent="my_bookings",
            events=[],
            action="navigate",
            quick_replies=["Show My Tickets", "Ticket Help", "Recommend Events"]
        )

    @classmethod
    def _handle_music_weekend(cls, lower: str, db: Session) -> ChatMessageResponse:
        is_music = "music" in lower or "concert" in lower
        is_weekend = "weekend" in lower

        query = db.query(Event).filter(
            Event.event_status == "UPCOMING",
            Event.available_tickets > 0
        )

        if is_music:
            query = query.filter(Event.category.ilike("%music%"))

        events = query.order_by(Event.event_date.asc()).all()

        if is_weekend and events:
            # Filter for weekend (weekday 5=Sat, 6=Sun or 4=Fri evening)
            weekend_events = [e for e in events if e.event_date.weekday() in [4, 5, 6]]
            if weekend_events:
                events = weekend_events

        event_cards = [event_to_card(e) for e in events[:4]]

        if not event_cards:
            # Fallback to general upcoming events
            fallback_events = (
                db.query(Event)
                .filter(Event.event_status == "UPCOMING", Event.available_tickets > 0)
                .order_by(Event.event_date.asc())
                .limit(3)
                .all()
            )
            cards = [event_to_card(e) for e in fallback_events]
            category_label = "music " if is_music else ""
            reply = (
                f"I couldn't find any upcoming {category_label}events this weekend, but here are other great upcoming events happening soon on SmartEvent:"
            )
            return ChatMessageResponse(
                reply=reply,
                intent="events_category_date",
                events=cards,
                action="navigate",
                quick_replies=["Find Events", "Trending Events", "My Bookings"]
            )

        title = "🎵 Upcoming Music Events" if is_music else "🎉 Events Happening This Weekend"
        reply = (
            f"### {title}\n\n"
            f"Found **{len(event_cards)}** exciting event(s) matching your request. Click any card below to view details and book your spot!"
        )

        return ChatMessageResponse(
            reply=reply,
            intent="events_category_date",
            events=event_cards,
            action="navigate",
            quick_replies=["Trending Events", "My Tickets", "How to Book"]
        )

    @classmethod
    def _handle_events_search(cls, lower: str, db: Session) -> ChatMessageResponse:
        loc = extract_location(lower)

        query = db.query(Event).filter(
            Event.event_status == "UPCOMING",
            Event.available_tickets > 0
        )

        if loc and loc != "near_me":
            query = query.filter(
                (Event.location.ilike(f"%{loc}%")) |
                (Event.title.ilike(f"%{loc}%")) |
                (Event.category.ilike(f"%{loc}%"))
            )

        events = query.order_by(Event.event_date.asc()).limit(5).all()

        # If specific search returned no events, return popular upcoming events
        if not events:
            all_events = (
                db.query(Event)
                .filter(Event.event_status == "UPCOMING", Event.available_tickets > 0)
                .order_by(Event.event_date.asc())
                .limit(4)
                .all()
            )
            cards = [event_to_card(e) for e in all_events]
            reply = (
                f"I couldn't find upcoming events matching **'{loc}'**, but here are top upcoming events across all locations on SmartEvent:"
            )
            return ChatMessageResponse(
                reply=reply,
                intent="events_location",
                events=cards,
                action="navigate",
                quick_replies=["Music This Weekend", "Trending Events", "How to Book"]
            )

        cards = [event_to_card(e) for e in events]
        loc_text = f" in **{loc.title()}**" if loc and loc != "near_me" else ""
        reply = (
            f"### 📍 Upcoming Events{loc_text}\n\n"
            f"Found **{len(cards)}** upcoming event(s) with tickets available. Select any event below for full details and instant seat reservations:"
        )

        return ChatMessageResponse(
            reply=reply,
            intent="events_location",
            events=cards,
            action="navigate",
            quick_replies=["Music This Weekend", "Trending Events", "Show My Bookings"]
        )

    @classmethod
    def _handle_recommendations(cls, current_user: Optional[User], db: Session) -> ChatMessageResponse:
        preferred_categories = defaultdict(float)
        booked_event_ids = set()

        if current_user:
            user_bookings = (
                db.query(Booking)
                .filter(Booking.user_id == current_user.id, Booking.booking_status == "CONFIRMED")
                .all()
            )
            booked_event_ids = {b.event_id for b in user_bookings}

            for booking in user_bookings:
                evt = db.query(Event).filter(Event.id == booking.event_id).first()
                if evt:
                    preferred_categories[evt.category] += 1

            user_reviews = db.query(Review).filter(Review.user_id == current_user.id).all()
            for rev in user_reviews:
                evt = db.query(Event).filter(Event.id == rev.event_id).first()
                if evt and rev.rating >= 4:
                    preferred_categories[evt.category] += 2

        upcoming_events = (
            db.query(Event)
            .filter(Event.event_status == "UPCOMING", Event.available_tickets > 0)
            .all()
        )

        scored_events = []
        for evt in upcoming_events:
            if evt.id in booked_event_ids:
                continue
            score = preferred_categories.get(evt.category, 0)
            scored_events.append((score, evt))

        scored_events.sort(key=lambda x: (x[0], x[1].event_date), reverse=True)
        recommended = [evt for score, evt in scored_events[:4]]

        cards = [event_to_card(e) for e in recommended]

        if current_user and preferred_categories:
            top_cat = max(preferred_categories.items(), key=lambda x: x[1])[0]
            reply = (
                f"### ✨ Personalized Recommendations for {current_user.username}\n\n"
                f"Based on your interest in **{top_cat}** and past bookings, here are top picks tailored for you:"
            )
        else:
            reply = (
                "### ✨ Trending & Recommended Events\n\n"
                "Here are the most popular upcoming events on SmartEvent right now:"
            )

        return ChatMessageResponse(
            reply=reply,
            intent="recommendations",
            events=cards,
            action="navigate",
            quick_replies=["Music This Weekend", "Events Near Me", "My Bookings"]
        )

    @classmethod
    def _handle_faq_navigation(cls, lower: str) -> Optional[ChatMessageResponse]:
        # Booking process FAQ
        if any(k in lower for k in ["how to book", "how do i book", "booking guide", "buy ticket", "purchase ticket"]):
            reply = (
                "### 📖 How to Book Tickets on SmartEvent\n\n"
                "Booking your spot takes just a few quick steps:\n\n"
                "1. **Explore Events:** Browse upcoming events on the **[Home](/)** page or search by category.\n"
                "2. **View Event Details:** Click on any event card to view the venue, timings, price, and remaining tickets.\n"
                "3. **Select Tickets:** Click **Book Now**, choose your ticket quantity, and enter any coupon code.\n"
                "4. **Complete Payment:** Checkout securely via card or UPI simulation.\n"
                "5. **Instant QR Ticket:** Your digital ticket is issued immediately and saved to **[My Tickets](/tickets)**."
            )
            return ChatMessageResponse(
                reply=reply,
                intent="faq_navigation",
                events=[],
                action="navigate",
                quick_replies=["Find Events", "Show My Tickets", "Coupons & Discounts"]
            )

        # Coupon / Discount FAQ
        if any(k in lower for k in ["coupon", "discount", "promo", "voucher", "code"]):
            reply = (
                "### 🏷️ Coupons and Discounts\n\n"
                "SmartEvent lets you apply discount coupon codes during checkout!\n\n"
                "- When booking an event, enter your promotional code in the **Coupon Code** field.\n"
                "- Valid coupons apply instant percentage or fixed discounts to your total bill.\n"
                "- Keep an eye on organizer announcements for seasonal and early-bird promo codes!"
            )
            return ChatMessageResponse(
                reply=reply,
                intent="faq_navigation",
                events=[],
                action="navigate",
                quick_replies=["Find Events", "How to Book", "My Bookings"]
            )

        # Refund / Cancellation FAQ
        if any(k in lower for k in ["refund", "cancel booking", "cancellation", "cancel ticket"]):
            reply = (
                "### 🔄 Refunds and Cancellations\n\n"
                "- **Event Cancellation by Organizer:** If an organizer cancels an event, all ticket holders are immediately notified via the **[Notifications](/notifications)** center.\n"
                "- **Refund Processing:** Approved refunds for cancelled events are processed to the original payment method.\n"
                "- **Attendee Cancellation:** Ticket policies depend on the event organizer's guidelines as specified in the event details."
            )
            return ChatMessageResponse(
                reply=reply,
                intent="faq_navigation",
                events=[],
                action="navigate",
                quick_replies=["Ticket Help", "My Bookings", "Notifications"]
            )

        # Wishlist FAQ
        if any(k in lower for k in ["wishlist", "save event", "saved events", "favorite"]):
            reply = (
                "### ❤️ Wishlist & Saved Events\n\n"
                "- Click the heart icon on any event card to save it to your wishlist.\n"
                "- You can review and manage all your saved events at any time on your **[Wishlist](/wishlist)** page."
            )
            return ChatMessageResponse(
                reply=reply,
                intent="faq_navigation",
                events=[],
                action="navigate",
                quick_replies=["Wishlist", "Trending Events", "My Bookings"]
            )

        # Profile FAQ
        if any(k in lower for k in ["profile", "account details", "change password", "my account"]):
            reply = (
                "### 👤 Profile & Account Management\n\n"
                "- Visit your **[Profile](/profile)** page to view your username, email, and registered role.\n"
                "- Keep your account credentials safe and access your order history from the navigation bar."
            )
            return ChatMessageResponse(
                reply=reply,
                intent="faq_navigation",
                events=[],
                action="navigate",
                quick_replies=["Profile", "My Bookings", "My Tickets"]
            )

        # Organizer / Admin dashboard
        if any(k in lower for k in ["organizer dashboard", "create event", "host event", "admin dashboard"]):
            reply = (
                "### 🏢 Organizer & Admin Portals\n\n"
                "- **Organizers:** Head over to the **[Organizer Dashboard](/organizer/dashboard)** to create events, monitor ticket sales in real-time, and post announcements to attendees.\n"
                "- **Administrators:** Platform administrators can access the **[Admin Dashboard](/admin/dashboard)** to oversee platform metrics, moderate events, and manage user accounts."
            )
            return ChatMessageResponse(
                reply=reply,
                intent="faq_navigation",
                events=[],
                action="navigate",
                quick_replies=["Trending Events", "My Bookings", "How to Book"]
            )

        return None

    @classmethod
    def _handle_fallback(cls, lower: str) -> ChatMessageResponse:
        reply = (
            "👋 Hi there! I'm your **SmartEvent AI Assistant**.\n\n"
            "I'm here to help you discover events, check your tickets, and navigate the platform. Here are some things you can ask me:\n\n"
            "- 🔍 *\"Find events near me\"* or *\"Events in Hyderabad\"*\n"
            "- 🎵 *\"Suggest music events this weekend\"*\n"
            "- 📋 *\"Show my bookings\"*\n"
            "- 🎟️ *\"Show my tickets\"*\n"
            "- ❓ *\"Help with ticket issues\"*\n"
            "- ✨ *\"Recommend events for me\"*\n"
            "- 📖 *\"How do I book tickets?\"*\n\n"
            "Feel free to click any suggestion below or type your question!"
        )
        return ChatMessageResponse(
            reply=reply,
            intent="fallback",
            events=[],
            action=None,
            quick_replies=["Trending Events", "Music This Weekend", "My Bookings", "My Tickets", "Ticket Help"]
        )
