# SmartEvent 🎉

SmartEvent is an Event Discovery and Ticket Booking System built using FastAPI and React.

The application allows users to discover upcoming events, search and filter events, book tickets, receive QR-based tickets, view booking history, and receive booking notifications. It also includes role-based access, organizer event management, event status tracking, and an admin dashboard for analytics.

---

## 📌 Project Overview

SmartEvent provides an event booking experience with:

- User registration and login
- JWT-based authentication
- Role-based access control
- Protected user routes
- Event discovery, search, and category filtering
- Event details and ticket availability
- Ticket booking and booking history
- Unique ticket codes and QR code generation
- User notifications
- Organizer event management
- Organizer dashboard and booking insights
- Event status management
- Event cancellation and related notifications
- Admin dashboard and analytics
- User, event, booking, and revenue statistics
- React-based frontend

---

## 🛠️ Technologies Used

### Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT Authentication
- Passlib
- Bcrypt
- Uvicorn
- Python-dotenv
- QRCode

### Frontend

- React
- Vite
- JavaScript
- Axios
- React Router
- CSS

---

## 📂 Project Structure

```text
SmartEvent/
│
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── dependencies.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── security.py
│   │   │
│   │   ├── database/
│   │   │   └── connection.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── event.py
│   │   │   ├── booking.py
│   │   │   ├── ticket.py
│   │   │   └── notification.py
│   │   │
│   │   ├── routers/
│   │   │   ├── event.py
│   │   │   ├── booking.py
│   │   │   ├── ticket.py
│   │   │   ├── notification.py
│   │   │   └── admin.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── event.py
│   │   │   ├── booking.py
│   │   │   ├── ticket.py
│   │   │   └── notification.py
│   │   │
│   │   ├── utils/
│   │   │   └── qr.py
│   │   │
│   │   ├── static/
│   │   │   └── qr/
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── smartevent.db
│
├── frontend/
│   ├── public/
│   │   └── events/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── EventDetails.jsx
│   │   │   ├── Booking.jsx
│   │   │   ├── BookingConfirmation.jsx
│   │   │   ├── BookingHistory.jsx
│   │   │   ├── Tickets.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── OrganizerDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   └── package.json
│
├── screenshots/
│
└── README.md
```

---

## 🔐 Module 1 — Authentication

SmartEvent provides user authentication using JWT.

### Features

- User registration
- User login
- Password hashing
- JWT access token generation
- Protected API endpoints
- User profile endpoint
- Frontend authentication state
- Protected React routes

### Authentication APIs

```text
POST /auth/register
POST /auth/login
GET  /auth/profile
```

---

## 🎫 Module 2 — Event Discovery

Users can discover and explore available events.

### Event Information

Each event can contain:

- Title and description
- Category
- Location
- Event date
- Ticket price
- Available ticket count
- Banner image
- Created date

### Event Categories

- Music
- Tech
- Sports
- Business

### Event APIs

```text
POST /events
GET  /events
GET  /events/{event_id}
GET  /events/category/{category}
GET  /events/search?query={query}
```

### Frontend Features

- Event cards
- Event images
- Event search
- Category filtering
- Event details page
- Ticket availability display

---

## 🎟️ Module 3 — Ticket Booking

Authenticated users can book tickets for available events.

### Features

- Select ticket quantity
- Validate ticket availability
- Prevent booking when tickets are insufficient
- Automatically calculate total price
- Confirm bookings
- Update available ticket count
- View booking history

### Booking APIs

```text
POST /bookings
GET  /bookings
```

The total price is calculated using:

```text
Total Price = Ticket Price × Ticket Quantity
```

Bookings are associated with the authenticated user.

---

## 📱 Module 4 — QR Tickets

After a successful booking, SmartEvent generates a unique ticket.

### Features

- Unique ticket ID
- Unique ticket code
- QR code generation
- QR image storage
- Ticket display for users

### Ticket API

```text
GET /tickets
```

Example ticket code:

```text
SMARTEVENT-XXXXXXXX
```

QR codes are generated automatically after booking confirmation.

---

## 🔔 Module 5 — Notifications

Users receive notifications related to their bookings and relevant event updates.

### Features

- Notification title and message
- Notification type
- Read and unread status
- Created date
- Booking confirmation notifications
- Event update notifications
- Event cancellation notifications

### Notification APIs

```text
GET   /notifications
PATCH /notifications/{notification_id}/read
```

Users can view their notifications and mark them as read from the frontend.

---

## ⚛️ Module 6 — React Frontend

The frontend is developed using React and Vite.

### Pages

- Register
- Login
- Home
- Event Details
- Booking
- Booking Confirmation
- Booking History
- Tickets
- Notifications

### Components

- Navbar
- EventCard
- ProtectedRoute

### Features

- Responsive user interface
- Event cards with images
- Search and filtering
- Authentication forms
- Protected routes
- Ticket booking
- Booking confirmation
- Booking history
- QR ticket display
- Notifications
- Loading states
- Error handling

---

## 👥 Module 7 — Role-Based Access Control

SmartEvent uses role-based access control to manage permissions.

### Roles

- **USER** — Browse events, book tickets, view tickets, and manage personal notifications.
- **ORGANIZER** — Manage permitted events and access organizer-related information.
- **ADMIN** — Access administrative functionality and analytics.

### Features

- User roles
- JWT-based authentication
- Role-based endpoint protection
- Protected frontend routes
- Access control for restricted operations

---

## 🗓️ Module 8 — Organizer Event Management

Organizers can manage their events through the organizer functionality.

### Features

- View organizer events
- Create and manage permitted events
- Update event information
- View event-related bookings
- Access organizer-specific information

Organizer operations are protected according to the user's role.

---

## 📊 Module 9 — Organizer Dashboard and Insights

The organizer dashboard provides an overview of event performance.

### Features

- Organizer dashboard
- Event-related booking information
- Ticket and booking insights
- Event performance overview

The dashboard helps organizers review information related to their events.

---

## 🔄 Module 10 — Event Status Management

SmartEvent supports event status tracking and event update notifications.

### Event Statuses

- UPCOMING
- ONGOING
- COMPLETED
- CANCELLED

### Features

- Manage event status
- Track event progress
- Display event status on the event details page
- Handle cancelled events
- Prevent ticket booking for cancelled events
- Create notifications for relevant event updates and cancellations

This module helps users understand the current status of an event before booking tickets.

---

## 🛡️ Module 11 — Admin Dashboard and Analytics

The admin dashboard provides an overview of SmartEvent activity.

### Dashboard Statistics

- Total users
- Total events
- Total bookings
- Tickets sold
- Total revenue

### Analytics

- Daily ticket sales
- Date-based sales filtering
- Monthly booking trends
- Popular events
- Top revenue-generating events
- User information
- Event information
- Booking information

### Features

- Admin-only dashboard access
- Summary statistics
- Sales analytics
- Booking trends
- Event performance information
- Date filters and reset functionality

The dashboard helps administrators monitor event booking activity and overall platform performance.

---

## 🗄️ Database

SmartEvent uses SQLite with SQLAlchemy for database operations.

### Main Tables

**User**

Stores registered user information, roles, and hashed passwords.

**Event**

Stores event details, pricing, available ticket count, and event status.

**Booking**

Stores booking information, ticket quantity, and total price.

**Ticket**

Stores unique ticket codes and QR code information.

**Notification**

Stores user notifications and their read/unread status.

---

## 🔒 Security

The application includes the following security features:

- JWT-based authentication
- Password hashing
- Protected API endpoints
- Role-based access control
- User-specific booking history
- User-specific tickets and notifications
- Pydantic input validation
- Environment variables for sensitive configuration
- HTTP error handling

---

## ⚙️ Backend Setup

### 1. Open the backend folder

```bash
cd SmartEvent/backend
```

### 2. Create and activate a virtual environment

For Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file inside the backend folder.

Example configuration:

```env
DATABASE_URL=sqlite:///./smartevent.db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Use your own secure secret key. Do not upload real passwords, tokens, or secret keys to GitHub.

### 5. Start the FastAPI server

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

---

## 📖 API Documentation

FastAPI provides interactive API documentation through Swagger UI.

Open the following URL after starting the backend:

```text
http://127.0.0.1:8000/docs
```

Use Swagger UI to explore and test the available API endpoints.

---

## ⚛️ Frontend Setup

### 1. Open the frontend folder

```bash
cd SmartEvent/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the React development server

```bash
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

---

## 🔄 Application Flow

The main user flow is:

```text
Register
   ↓
Login
   ↓
JWT Authentication
   ↓
Browse Events
   ↓
Search and Filter Events
   ↓
View Event Details
   ↓
Select Tickets
   ↓
Confirm Booking
   ↓
Booking Created
   ↓
QR Ticket Generated
   ↓
Notification Created
   ↓
View Ticket and Booking History
   ↓
View Notifications
```

Organizers can access their permitted event management and dashboard features. Administrators can access the admin dashboard and analytics.

---

## 🧪 Testing

The backend APIs were tested using FastAPI Swagger documentation.

### Functionality Tested

- User registration and login
- JWT authentication
- Protected endpoints
- Role-based access
- Event creation and listing
- Event details
- Category filtering and event search
- Ticket booking
- Ticket availability validation
- Booking history
- QR ticket generation
- User notifications
- Marking notifications as read
- Organizer dashboard
- Event status management
- Admin analytics
- Daily ticket sales filtering
- Monthly booking trends
- Popular events and revenue information

The React frontend was also tested for the main user pages, event booking flow, organizer dashboard, event details, and admin dashboard.

---

## 📸 Project Evidence

Screenshots of API testing and frontend functionality are stored in the `screenshots/` folder.

The screenshots provide evidence of the different SmartEvent modules, including authentication, event discovery, booking, QR tickets, notifications, organizer functionality, event status management, and admin analytics.

---

## 🚀 Future Enhancements

Possible future improvements include:

- Online payment integration
- Automated event reminders
- Email notifications
- Ticket cancellation and refunds
- Advanced event recommendations
- PostgreSQL database support
- Cloud deployment
- Production environment configuration

---

## 👩‍💻 Project Details

**Project Name:** SmartEvent  
**Project Type:** Event Discovery and Ticket Booking System  
**Backend:** FastAPI and Python  
**Frontend:** React and Vite  
**Database:** SQLite  
**ORM:** SQLAlchemy  
**Authentication:** JWT  
**Ticket System:** QR-based tickets  

GitHub Repository: https://github.com/akhilaakhilaa/SmartEvent
