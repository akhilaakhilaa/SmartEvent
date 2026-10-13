# SmartEvent 🎉

SmartEvent is an event discovery and ticket-booking web application
built with **FastAPI**, **React**, and **SQLite**. Users can explore
events, search and filter listings, book tickets, complete payments
through Stripe Checkout, and access digital tickets with unique ticket
codes and QR codes.

The project also includes JWT authentication, role-based access,
organizer event management, event-status handling, notifications, and an
admin dashboard with analytics.

## 📌 Features

### User experience

-   User registration and login
-   JWT-based authentication and protected routes
-   Browse events and view event details
-   Search events and filter by category, location, and date
-   Sort event listings
-   Check ticket availability
-   Book tickets and view booking history
-   Apply coupon codes and view discounts
-   Complete checkout using Stripe test payments
-   View payment and booking status
-   Access digital tickets with unique ticket codes and QR codes
-   Receive booking, payment, and event-related notifications
-   Responsive interface for desktop and mobile layouts

### Organizer features

-   Organizer dashboard
-   Create and manage permitted events
-   Update event information and event status
-   Review event-related bookings and insights

### Admin features

-   Admin dashboard and analytics
-   Overview of users, events, bookings, tickets sold, and revenue
-   Sales and booking trends
-   Date-based sales filtering
-   Popular events and revenue information

## 🛠️ Technology Stack

### Backend

-   Python
-   FastAPI
-   SQLAlchemy
-   SQLite
-   Pydantic
-   JWT authentication
-   Passlib and bcrypt
-   Uvicorn
-   Python-dotenv
-   QR code generation
-   Stripe payment integration

### Frontend

-   React
-   Vite
-   JavaScript
-   Axios
-   React Router
-   CSS

## 📂 Project Structure

``` text
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
│   │   └── events/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
├── screenshots/
└── README.md
```

## 🔐 Authentication

SmartEvent uses JWT authentication and password hashing.

Features include: - Registration and login - JWT access-token
generation - Protected API endpoints and frontend routes - Role-based
access for `USER`, `ORGANIZER`, and `ADMIN`

Authentication endpoints:

``` text
POST /auth/register
POST /auth/login
GET  /auth/profile
```

## 🎫 Event Discovery

Users can browse events and view details such as title, description,
category, location, date, price, available tickets, and banner image.

Discovery features include: - Event cards and event details - Search -
Category and location filtering - Date filtering - Sorting - Ticket
availability display

Common event endpoints:

``` text
GET  /events
GET  /events/{event_id}
GET  /events/category/{category}
GET  /events/search?query={query}
POST /events
```

## 🎟️ Booking, Coupons, and Payments

Authenticated users can select ticket quantities and create bookings.
The application checks ticket availability and calculates the booking
amount.

Features include: - Ticket quantity selection and availability
validation - Booking history - Coupon validation and discount
calculation - Stripe Checkout integration for payment - Payment status
display - Booking and payment notifications

Booking endpoints:

``` text
POST /bookings
GET  /bookings
```

**Payment configuration:** Configure Stripe credentials in the backend
environment file using the variable names expected by the backend code.
Use Stripe test credentials for development. Never commit secret keys,
access tokens, passwords, or real payment credentials to GitHub.

## 🎟️ Digital QR Tickets

The application provides digital tickets associated with bookings.

Features include: - Unique ticket IDs and ticket codes - QR code
generation and image storage - A My Tickets page for viewing digital
tickets - QR codes available for verification

Ticket endpoint:

``` text
GET /tickets
```

Example ticket-code format:

``` text
SMARTEVENT-XXXXXXXX
```

## 🔔 Notifications

Users can view notifications related to bookings, payments, and event
updates.

Features include: - Notification title and message - Notification type -
Read/unread status - Created date - Booking and payment notifications -
Event update and cancellation notifications - Mark a notification as
read or mark all as read

Notification endpoints:

``` text
GET   /notifications
GET   /notifications/unread-count
PATCH /notifications/{notification_id}/read
PATCH /notifications/read-all
```

## 👥 Organizer and Admin Modules

### Organizer dashboard

-   View organizer events
-   Create and update permitted events
-   Review event-related bookings and insights
-   Manage event status where permitted

### Event status management

Supported statuses include: - `UPCOMING` - `ONGOING` - `COMPLETED` -
`CANCELLED`

Cancelled events are handled in the booking flow, and relevant event
updates can generate notifications.

### Admin dashboard

The admin dashboard includes summaries and analytics for users, events,
bookings, tickets sold, and revenue. It can also display sales trends,
booking trends, popular events, and date-filtered information.

## 🗄️ Database

SmartEvent uses **SQLite** with **SQLAlchemy**.

Main data models include: - **User:** account information, role, and
hashed password - **Event:** event details, price, available tickets,
and status - **Booking:** booking information, quantity, and total
amount - **Ticket:** unique ticket codes and QR information -
**Notification:** user notifications and read/unread status -
**Payment:** payment-related information, depending on the backend model
implementation

## 🔒 Security Notes

-   Password hashing
-   JWT authentication
-   Protected API endpoints
-   Role-based access control
-   User-specific booking, ticket, and notification access
-   Pydantic input validation
-   Environment-based configuration for secrets
-   HTTP error handling

Do not upload `.env` files or real credentials to the repository.

## ⚙️ Setup and Run

### Prerequisites

-   Python installed
-   Node.js and npm installed

### 1. Start the backend

Open PowerShell or a terminal in the project folder:

``` powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `backend/.env` file and set the database URL, a secure secret
key, and the other configuration variables required by the application.
For example:

``` env
DATABASE_URL=sqlite:///./smartevent.db
SECRET_KEY=replace_with_a_secure_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Also add the Stripe environment variables required by your backend
implementation. Keep all real secret values private.

Start FastAPI:

``` powershell
uvicorn app.main:app --reload
```

Backend base URL:

``` text
http://127.0.0.1:8000
```

Interactive API documentation:

``` text
http://127.0.0.1:8000/docs
```

### 2. Start the frontend

Open a **second** terminal:

``` powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually:

``` text
http://localhost:5173
```

## 🔄 Main User Flow

``` text
Register / Login
       ↓
Browse, Search, and Filter Events
       ↓
View Event Details
       ↓
Select Tickets
       ↓
Apply Coupon (optional)
       ↓
Confirm Booking
       ↓
Complete Stripe Checkout
       ↓
View Booking and Payment Status
       ↓
Access Digital Ticket and QR Code
       ↓
Receive and View Notifications
```

## 🧪 Testing

The following user-facing flows were manually checked during
development: - Home page and event cards - Event details navigation -
Event search and filters - Booking page and coupon validation - Stripe
test checkout - Booking history - Digital ticket display and ticket
codes - QR code display - Notifications, including payment
confirmation - Mobile layout

Backend endpoints and organizer/admin functionality should also be
tested in the target environment before a release. A successful
test-mode Stripe payment does not mean the application is configured for
live payments.

## 📸 Screenshots

Project screenshots are stored in the `screenshots/` folder. The Module
17 screenshots include:

-   `Module17_01_Home_Page_Top.png`
-   `Module17_02_Event_Cards.png`
-   `Module17_03_Event_Details.png`
-   `Module17_04_Booking_Page.png`
-   `Module17_05_Booking_Confirmation.png`
-   `Module17_06_Booking_History.png`
-   `Module17_07_My_Tickets.png`
-   `Module17_08_Notifications.png`
-   `Module17_11_Mobile_View.png`

Make sure the filenames above match the actual files in your
`screenshots/` folder before committing the README.

## 🚀 Possible Future Enhancements

-   Email notifications and automated event reminders
-   Ticket cancellation and refund workflows
-   More advanced event recommendations
-   PostgreSQL support
-   Cloud deployment and production configuration
-   Additional automated tests

## 👩‍💻 Project Details

-   **Project name:** SmartEvent
-   **Project type:** Event Discovery and Ticket Booking System
-   **Backend:** Python and FastAPI
-   **Frontend:** React and Vite
-   **Database:** SQLite
-   **ORM:** SQLAlchemy
-   **Authentication:** JWT
-   **Payments:** Stripe Checkout (test mode tested)
-   **Tickets:** Digital tickets with QR codes

**GitHub repository:** https://github.com/akhilaakhilaa/SmartEvent
