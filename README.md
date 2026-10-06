# SmartEvent 🎉

SmartEvent is an Event Discovery and Ticket Booking System built using FastAPI and React.

The application allows users to discover upcoming events, search and filter events, book tickets, receive QR-based tickets, view booking history, and receive booking notifications.

---

## 📌 Project Overview

SmartEvent provides a complete event booking experience with:

- User registration and login
- JWT-based authentication
- Protected user routes
- Event discovery
- Event search
- Category filtering
- Event details
- Ticket booking
- Ticket availability validation
- Booking history
- Unique ticket codes
- QR code generation
- User notifications
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
│   │
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
│   │   │   └── notification.py
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
│   ├── .env
│   ├── requirements.txt
│   └── smartevent.db
│
├── frontend/
│   │
│   ├── public/
│   │   └── events/
│   │       ├── music-night.png
│   │       ├── tech-meetup.png
│   │       └── tech-summit.png
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
│   │   │   └── Notifications.jsx
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

🔐 Module 1 — Authentication
SmartEvent provides secure user authentication using JWT.
Features
- User registration
- User login
- Password hashing using bcrypt
- JWT access token generation
- Protected API endpoints
- User profile endpoint
- Frontend authentication state
- JWT token stored on the client
- Protected React routes
Authentication APIs
POST /auth/register
POST /auth/login
GET  /auth/profile

🎫 Module 2 — Event Discovery
Users can discover and explore available events.
Event Information
Each event contains:
- Title
- Description
- Category
- Location
- Event date
- Ticket price
- Available tickets
- Banner image
- Created date
Event Categories
Music
Tech
Sports
Business

Event APIs
POST /events
GET  /events
GET  /events/{event_id}
GET  /events/category/{category}
GET  /events/search?query={query}

Frontend Features
- Event cards
- Event images
- Search events
- Filter by category
- Event details page
- Ticket availability display
🎟️ Module 3 — Ticket Booking
Authenticated users can book tickets for available events.
Booking Features
- Select ticket quantity
- Check ticket availability
- Prevent booking when tickets are insufficient
- Automatically calculate total price
- Confirm booking
- Reduce available ticket count
- View booking history
Booking APIs
POST /bookings
GET  /bookings

The total price is calculated automatically:
Total Price = Ticket Price × Ticket Quantity

Bookings are associated with the authenticated user.
📱 Module 4 — QR Tickets
After a successful booking, SmartEvent generates a unique ticket.
Ticket Features
- Unique ticket ID
- Unique ticket code
- QR code generation
- QR image storage
- User ticket display
Ticket API
GET /tickets

Example ticket code:
SMARTEVENT-XXXXXXXX

QR codes are generated automatically after booking confirmation.
🔔 Module 5 — Notifications
Users receive notifications related to their bookings.
Notification Information
Each notification contains:
- Title
- Message
- Type
- Read/unread status
- Created date
Notification Types
EVENT
BOOKING
SYSTEM

Notification APIs
GET   /notifications
PATCH /notifications/{notification_id}/read

When a booking is confirmed, a booking confirmation notification is automatically created.
Users can mark notifications as read from the frontend.
⚛️ Module 6 — React Frontend
The frontend is developed using React and Vite.
Pages
Register
Login
Home
Event Details
Booking
Booking Confirmation
Booking History
Tickets
Notifications

Components
Navbar
EventCard
ProtectedRoute

Frontend Features
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
🗄️ Database
SmartEvent uses SQLite with SQLAlchemy.
Tables
Users
Events
Bookings
Tickets
Notifications

User
Stores registered user information and hashed passwords.
Event
Stores event details, pricing and available ticket count.
Booking
Stores the user's booking information and total price.
Ticket
Stores the unique ticket code and QR code path.
Notification
Stores user notifications and their read/unread status.
🔒 Security
The application includes several security features:
- JWT-based authentication
- Password hashing using bcrypt
- Protected booking routes
- User-specific booking history
- User-specific tickets
- User-specific notifications
- Pydantic input validation
- Environment variables for sensitive configuration
- HTTP error handling
⚙️ Backend Setup
1. Open the backend folder
cd SmartEvent\backend

2. Create and activate the virtual environment
Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

3. Install dependencies
pip install -r requirements.txt

4. Configure environment variables
Create a .env file inside the backend folder.
Example:
DATABASE_URL=sqlite:///./smartevent.db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

5. Start the FastAPI server
uvicorn app.main:app --reload

The backend will run at:
http://127.0.0.1:8000

📖 API Documentation
FastAPI automatically provides interactive API documentation.
Open:
http://127.0.0.1:8000/docs

The Swagger documentation can be used to test the APIs.
⚛️ Frontend Setup
1. Open the frontend folder
cd SmartEvent\frontend

2. Install dependencies
npm install

3. Start the React development server
npm run dev

The frontend will run at:
http://localhost:5173

🔄 Application Flow
The main user flow is:
Register
   ↓
Login
   ↓
JWT Authentication
   ↓
Browse Events
   ↓
Search / Filter Events
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
View Ticket
   ↓
View Booking History
   ↓
View Notifications

🧪 Testing
The backend APIs were tested using FastAPI Swagger documentation.
The following functionality was tested:
User Registration
User Login
JWT Authentication
Protected Profile
Create Event
Get Events
Event Details
Category Filtering
Event Search
Create Booking
Ticket Availability Validation
Booking History
QR Ticket Generation
User Tickets
Notifications
Mark Notification as Read

The React frontend was also tested for:
Login
Registration
Event Listing
Event Search
Category Filtering
Event Details
Ticket Booking
Booking Confirmation
Booking History
QR Tickets
Notifications
Protected Routes

📸 Project Evidence
Screenshots of API testing and frontend functionality are stored in the:
screenshots/

folder.
The screenshots cover the different SmartEvent modules including authentication, event discovery, booking, QR tickets, notifications and the React frontend.
🚀 Future Enhancements
Possible future improvements include:
- Online payment integration
- Event reminder automation
- Admin event management
- Event cancellation
- Ticket cancellation and refunds
- Email notifications
- Advanced event recommendations
- PostgreSQL database
- Cloud deployment
- Production environment configuration
👩‍💻 Project
Project Name: SmartEvent
Project Type: Event Discovery and Ticket Booking System
Backend: FastAPI
Frontend: React + Vite
Database: SQLite
Authentication: JWT
Ticket System: QR-based tickets