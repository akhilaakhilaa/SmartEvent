# SmartEvent 🎉

**A Full-Stack Event Discovery and Ticket Booking Platform**

SmartEvent is a full-stack web application that enables users to discover events, book tickets, make payments, manage digital tickets, and receive event notifications. Organizers can create and manage events, while administrators can monitor platform activity through an analytics dashboard.

Built with **React, FastAPI, SQLAlchemy, and SQLite**, SmartEvent includes JWT authentication, Stripe test payments, QR-code tickets, real-time ticket availability, personalized recommendations, and role-based access control.

## 📌 Key Features

### 👤 User Features

- User registration and login with JWT authentication
- Browse, search, filter, and sort events
- View event details, pricing, dates, locations, and ticket availability
- Book event tickets and view booking history
- Apply coupons and discounts
- Complete checkout using Stripe test payments
- Access digital tickets with unique ticket codes and QR codes
- Save and remove events from a persistent wishlist
- Receive and manage notifications
- Update profile information and profile pictures
- View personal booking summaries
- Receive real-time ticket availability updates
- Discover personalized event recommendations
- View event announcements, including pinned announcements
- Conversational AI chatbot assistant for event discovery, bookings, tickets, and FAQs


### 🎪 Organizer Features

- Create and manage events
- Update event details and status
- Review event-related bookings and insights
- Publish and delete announcements for owned events
- Pin important announcements
- Notify users about relevant event updates

### 🛡️ Admin Features

- Admin dashboard and platform analytics
- User, event, booking, and ticket statistics
- Revenue and sales analytics
- Monthly booking trends
- Popular event and revenue rankings
- Date-based sales filtering
- Paginated user, event, and booking management
- User search and filtering
- Role management with confirmation safeguards
- Event status management
- Protection against demoting the last administrator

## 🛠️ Technology Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT authentication
- Passlib and bcrypt password hashing
- Uvicorn
- Python-dotenv
- Stripe integration
- WebSockets
- QR-code generation

### Frontend

- React
- Vite
- JavaScript
- Axios
- React Router
- CSS

### Development and Testing

- Git and GitHub
- Visual Studio Code
- PowerShell
- Python backend tests
- Vite production builds
- API and WebSocket verification

## 🏗️ Architecture

SmartEvent uses a client-server architecture.

- **Frontend:** React provides the user interface and communicates with the backend through HTTP API requests.
- **Backend:** FastAPI handles authentication, business logic, bookings, payments, tickets, notifications, and administration.
- **Database:** SQLAlchemy manages application data stored in SQLite.
- **Real-time communication:** WebSockets broadcast ticket availability updates.
- **Payment processing:** Stripe Checkout supports test-mode payment workflows.
- **Authentication and authorization:** JWT tokens and role-based permissions protect restricted functionality.

## 📂 Project Structure

```text
SmartEvent/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── utils/
│   │   ├── static/
│   │   └── main.py
│   ├── requirements.txt
│   └── smartevent.db
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── screenshots/
└── README.md
```

## 🔐 Authentication and Authorization

SmartEvent uses JWT authentication and hashed passwords.

The application supports three roles:

| Role | Permissions |
|---|---|
| USER | Browse events, book tickets, manage a wishlist and profile |
| ORGANIZER | Manage permitted events and event announcements |
| ADMIN | Access platform analytics and administrative management features |

Protected API endpoints require appropriate authentication and permissions.

The regression tests verified that unauthenticated requests are rejected with HTTP 401, unauthorized roles receive HTTP 403 on restricted admin endpoints, and authorized administrators can access permitted endpoints.

## 🎟️ Event Discovery and Real-Time Availability

Users can browse events and view details such as descriptions, categories, locations, dates, prices, and available tickets.

Event discovery includes:

- Search and category filtering
- Location and date filtering
- Sorting and event details
- Ticket availability information

### Real-Time Ticket Availability — Module 18

SmartEvent uses WebSockets to broadcast inventory changes to connected clients.

WebSocket endpoint:

```text
ws://127.0.0.1:8000/ws/events/{event_id}/availability
```

The backend updates ticket inventory during successful booking confirmation and broadcasts availability changes without requiring a page reload.

Inventory deduction uses a conditional database update to prevent ticket quantities from exceeding the available stock.

## 🤖 Personalized Event Recommendations — Module 19

The recommendation system provides authenticated users with personalized event suggestions.

Features include:

- Personalized event recommendations
- Recommendation reasons and scores
- Event recommendation cards on the home page

Endpoint:

```http
GET /recommendations/
```

## ❤️ Wishlist System — Module 20

Users can save events to their wishlist and access their saved events later.

Features include:

- Add an event to the wishlist
- View saved events
- Remove saved events
- Persist wishlist entries across refreshes
- Prevent duplicate wishlist entries
- Protect user-specific wishlist data

Endpoints:

```http
POST   /wishlist/{event_id}
GET    /wishlist/
DELETE /wishlist/{event_id}
```

## 📢 Event Announcements — Module 21

Organizers can publish announcements for events they own.

Features include:

- Public viewing of event announcements
- Organizer-controlled announcement creation and deletion
- Pinned announcements displayed before regular announcements
- Ownership and authorization checks
- Event-related notification support

Endpoints:

```http
GET    /events/{event_id}/announcements
POST   /events/{event_id}/announcements
DELETE /events/{event_id}/announcements/{announcement_id}
```

Exact request fields and authorization requirements are defined by the backend implementation.

## 👤 User Profile Enhancements — Module 22

The profile module provides users with account information and personal booking details.

Features include:

- Retrieve and update profile information
- Upload a profile picture
- Validate uploaded image files
- View personal booking summaries
- Restrict profile and booking information to the authenticated user

Endpoints:

```http
GET  /auth/profile
PUT  /auth/profile
POST /auth/profile/picture
GET  /auth/profile/bookings
```

The backend validates profile updates and image uploads.

## 📊 Admin Dashboard — Module 23

The administration module provides an overview of platform activity and management tools.

### Overview and Analytics

- Total users and events
- Total bookings and tickets sold
- Successful-payment revenue
- Sales and booking trends
- Popular events
- Top revenue-generating events

### User Management

- Paginated user listing
- Search and filtering
- Role management
- Confirmation safeguards for role changes
- Protection against demoting the last administrator

### Event Moderation

- View and filter events
- Manage event status
- Notify relevant users about event updates or cancellations

### Booking Management

- Paginated booking overview
- Booking status information
- Platform-wide booking visibility for administrators

Representative admin endpoints include:

```http
GET   /admin/analytics/summary
PATCH /admin/users/{user_id}/role
PATCH /admin/events/{event_id}/status
```

Additional endpoints support analytics, event and user listings, and booking management.

## 🤖 AI Chatbot Assistant — Module 24

SmartEvent includes a conversational AI chatbot assistant designed to guide attendees, help discover events, look up bookings and tickets, and answer platform-wide questions.

### Capabilities and Supported Intents

- **Event Discovery by Location:** Find upcoming events near the user or in specific cities (e.g., *"Find events near me"*, *"Events in Hyderabad"*).
- **Music & Weekend Suggestions:** Discover concerts and weekend entertainment with direct event card previews (e.g., *"Suggest music events this weekend"*).
- **Booking Tracking:** Check recent orders, ticket quantities, payment status, and order totals (e.g., *"Show my bookings"*).
- **Digital Tickets & QR Codes:** Inspect digital tickets, ticket codes, and instructions for venue check-in (e.g., *"Show my tickets"*).
- **Ticket Troubleshooting:** Step-by-step guidance for missing tickets, QR code display, and organizer contacts (e.g., *"Help with ticket issues"*).
- **Platform FAQs & Navigation:** Detailed instructions on booking steps, discount coupons, cancellations and refunds, profile management, wishlists, and organizer/admin portals.
- **Personalized Recommendations:** Intelligent event recommendations utilizing category preferences from confirmed bookings and high ratings.

### Security and Ownership Isolation

- **Token-Based Identity:** Authenticated queries strictly derive identity from the verified JWT access token (`sub`), never from user IDs provided in chat messages.
- **Cross-User Protection:** Users can only view their own private bookings and tickets.
- **Unauthenticated Handling:** Unauthenticated users asking for personal bookings or tickets are prompted to log in without exposing system details or error traces.
- **Input Validation:** Messages are validated using Pydantic ($1 \le \text{length} \le 1000$ characters) and empty/whitespace inputs are rejected with appropriate error statuses.

### Endpoint

```http
POST /chatbot/message
```

**Request Body:**
```json
{
  "message": "Find events near me"
}
```

**Response Body:**
```json
{
  "reply": "### 📍 Upcoming Events...",
  "intent": "events_location",
  "events": [
    {
      "id": 1,
      "title": "Hyderabad Tech Summit 2026",
      "category": "Tech",
      "location": "HICC, Hyderabad",
      "event_date": "2026-12-15T10:00:00",
      "ticket_price": 999.0,
      "available_tickets": 96,
      "banner_image": null
    }
  ],
  "action": "navigate",
  "quick_replies": ["Music This Weekend", "Trending Events", "Show My Bookings"]
}
```

### Frontend Widget

The frontend includes a floating chat widget (`ChatbotWidget.jsx`) available across all pages:
- Floating launcher button with online pulse indicator at the bottom-right.
- Expandable chat dialog with rich Markdown formatting, bold headings, and clickable internal navigation links.
- Interactive event cards with direct links to event details (`/events/:id`).
- Quick-suggestion chips enabling 1-click queries.
- Typing animation indicator while awaiting responses.


## 🎟️ Booking, Payments, and Digital Tickets

Authenticated users can select ticket quantities, create bookings, apply eligible coupons, and proceed through checkout.

### Payment Workflow

1. A user creates a booking.
2. The backend validates the booking and ticket availability.
3. The user proceeds through the configured payment flow.
4. Successful payment confirmation updates the payment and booking records.
5. Ticket records and QR-code information are generated.
6. Updated ticket availability is broadcast to connected clients.

The backend includes safeguards against duplicate payment confirmation and repeated inventory deductions.

**Payment configuration:** The project has been tested with Stripe test payments. Live payment processing requires separate production configuration and verification.

### Digital Tickets

The ticket module provides digital tickets associated with bookings.

Features include:

- Unique ticket codes
- Ticket records associated with bookings
- QR-code generation and image storage
- A My Tickets page
- Ticket information for verification

Representative endpoint:

```http
GET /tickets
```

## 🔔 Notifications

The notification system supports user-facing updates related to bookings, payments, and events.

Features include:

- Notification titles and messages
- Notification types
- Read and unread status
- Creation timestamps
- Booking and payment notifications
- Event update and cancellation notifications

Representative endpoints:

```http
GET   /notifications
GET   /notifications/unread-count
PATCH /notifications/{notification_id}/read
PATCH /notifications/read-all
```

## 🗄️ Database

SmartEvent uses SQLite with SQLAlchemy.

Core data entities include:

- **User:** Account details, role, and password hash
- **Event:** Event information, pricing, status, and ticket inventory
- **Booking:** User bookings, ticket quantities, and booking totals
- **Payment:** Payment method, status, transaction information, and amount
- **Ticket:** Ticket codes and QR-code information
- **Notification:** User notifications and read status
- **Wishlist:** Saved events associated with users
- **Announcement:** Event announcements and pinned status
- **Coupon:** Coupon and discount information

The complete schema and relationships are defined by the backend models.

## ⚙️ Installation and Setup

### Prerequisites

Install the following:

- Python compatible with the backend dependencies
- Node.js and npm
- Git
- Visual Studio Code or another code editor

### 1. Clone the Repository

```powershell
git clone https://github.com/akhilaakhilaa/SmartEvent.git
cd SmartEvent
```

### 2. Configure the Backend

Open PowerShell in the project root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell prevents virtual environment activation, use an approved activation method for your environment or invoke the virtual environment's Python executable directly.

Create a `backend/.env` file with the configuration required by the actual backend code.

Example configuration, subject to the application's settings:

```dotenv
DATABASE_URL=sqlite:///./smartevent.db
SECRET_KEY=replace_with_a_secure_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Configure any required Stripe variables using the exact names expected by the backend. Never publish real credentials.

Start the backend from the `backend` directory:

```powershell
python -m uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Configure the Frontend

Open a second terminal in the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

Keep the backend and frontend running while using the application.

### 4. Production Build and Lint

From the `frontend` directory, run:

```powershell
npm run lint
npm run build
```

The lint command reports code-quality warnings, while the build command verifies that the frontend can be compiled for production.

## 🧪 Testing and Verification

A regression test suite was executed for Modules 18–23.

### Reported Results

| Test area | Result |
|---|---|
| Backend regression checks | All reported checks passed |
| Authentication and role permissions | Verified |
| Event browsing and inventory | Verified through API and WebSocket tests |
| Recommendations | Verified |
| Wishlist operations | Verified |
| Announcement permissions and pinned ordering | Verified |
| Profile validation and booking summary | Verified |
| Admin analytics and management safeguards | Verified |
| Payment, booking, and ticket integrity audit | Passed |
| Frontend production build | Successful |
| Frontend lint | 6 warnings, 0 errors |

The report recorded successful payment transactions totaling ₹7,093.10 at the time of testing.

The automated regression suite also reported that temporary test records were cleaned up and existing project records were preserved.

**Testing limitation:** These results cover the reported API tests, database checks, WebSocket verification, and production build. Automated headless browser testing was not performed as part of that regression run.

## 📸 Screenshots

Project screenshots are stored in the `screenshots/` directory.

### Core Application

Existing screenshots from earlier modules include examples such as:

- `Module17_01_Home_Page_Top.png`
- `Module17_02_Event_Cards.png`
- `Module17_03_Event_Details.png`
- `Module17_04_Booking_Page.png`
- `Module17_05_Booking_Confirmation.png`
- `Module17_06_Booking_History.png`
- `Module17_07_My_Tickets.png`
- `Module17_08_Notifications.png`
- `Module17_11_Mobile_View.png`

### Module 18 — Real-Time Availability

- `Module18_Inventory_Updated.png`
- `Module18_Live_Availability.png`

### Module 19 — Recommendations

- `Module19_Recommendations_Frontend.png`
- `Module19_Recommendations_API.png`

### Module 20 — Wishlist

- `Module20_Wishlist_Add.png`
- `Module20_Wishlist_Get.png`
- `Module20_Wishlist_Delete.png`
- `Module20_Wishlist_Navbar.png`

### Module 21 — Announcements

- `Module21_Announcements_Frontend.png`
- `Module21_Announcement_Publish.png`
- `Module21_Announcement_Pinned.png`

### Module 22 — User Profiles

- `Module22_Profile_View.png`
- `Module22_Profile_Edit.png`
- `Module22_Profile_Bookings.png`
- `Module22_Profile_Picture.png`

### Module 23 — Admin Dashboard

- `Module23_Admin_Dashboard.png`
- `Module23_Daily_Ticket_Sales.png`
- `Module23_Analytics.png`
- `Module23_User_Management.png`
- `Module23_User_Search.png`
- `Module23_Role_Change_Safeguard.png`
- `Module23_Event_Management.png`
- `Module23_Event_Status_Safeguard.png`
- `Module23_Bookings.png`
- `Module23_Bookings_Pagination.png`

### Module 24 — AI Chatbot Assistant

- `Module24_Chatbot_Widget.png`
- `Module24_Chatbot_Event_Discovery.png`
- `Module24_Chatbot_My_Bookings.png`

Only retain screenshot references that match actual files in the repository.


## 🔒 Security Notes

- Passwords are stored as hashes, not plaintext.
- JWT authentication protects restricted endpoints.
- Role-based authorization restricts administrative operations.
- User-specific data is scoped to the authenticated account where applicable.
- Input validation is enforced by the backend.
- Environment variables are used for secrets and configuration.

**Never commit `.env` files, passwords, private keys, access tokens, or real payment credentials.** Review `.gitignore` and staged files before pushing to GitHub.

Do not commit local databases or generated files unless they are intentionally required by the project.

## 🚀 Future Enhancements

Possible future improvements include:

- Automated browser-based end-to-end testing
- Email notifications and scheduled reminders
- Ticket cancellation and refund workflows
- Additional recommendation improvements
- PostgreSQL support
- Cloud deployment and production monitoring
- Further frontend lint cleanup
- Expanded automated test coverage

## 👩‍💻 Project Details

| Property | Value |
|---|---|
| Project name | SmartEvent |
| Project type | Event Discovery and Ticket Booking System |
| Backend | Python and FastAPI |
| Frontend | React and Vite |
| Database | SQLite |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Payments | Stripe test mode |
| Digital tickets | Ticket codes and QR codes |
| Repository | [GitHub — SmartEvent](https://github.com/akhilaakhilaa/SmartEvent) |

---

**SmartEvent brings event discovery, booking, payments, digital ticketing, and event administration together in one full-stack application.**