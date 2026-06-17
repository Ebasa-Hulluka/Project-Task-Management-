# Project Task Management System

A full-stack web application built to help teams manage projects, assign tasks, track progress, handle testing workflows, and improve team collaboration. The system supports multiple user roles including Super Admin, Admin, Project Manager, Team Member, and Tester. It includes features such as project and task management, team management, dashboards, notifications, chat, calendar view, test reports, and bug reporting.

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, Socket.io-client, Recharts
- **Backend**: Node.js + Express, MongoDB, Socket.io, JWT Authentication
- **Database**: MongoDB

## Features

- User role management (Super Admin, Admin, Project Manager, Team Member, Tester)
- Project and task management
- Team collaboration
- Real-time chat
- Notifications
- Calendar view
- Test reports and bug reporting
- Dashboards and analytics

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Project-Task-Management-
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy the `.env` file and update the values as needed.
   - Ensure MongoDB is running locally on port 27017, or update `MONGO_URL` for a different setup.
   - Configure email settings (SMTP) for notifications.

4. Start the backend server:
   ```bash
   npm run dev  # For development with nodemon
   # or
   npm start    # For production
   ```

   The server will run on `http://localhost:8000`.

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5174`.

### 4. Database Setup

- Ensure MongoDB is running.
- The application will automatically create collections and seed initial data on first run.

## Default Login Credentials

Use the following Super Admin account to log in:

- **Email**: ebasahuluka@gmail.com
- **Password**: 123456

## Usage

1. Open your browser and go to `http://localhost:5173`.
2. Log in with the default credentials.
3. Explore the features: create projects, assign tasks, manage teams, etc.

## API Documentation

The backend provides RESTful APIs for all functionalities. Refer to the routes in `backend/routes/` for endpoints.

## Render Deployment Notes

This project includes a `render.yaml` blueprint for deploying the backend as a Render web service.

If deployment fails with a MongoDB Atlas message about IP whitelist or Network Access, the code is reaching Atlas but Atlas is rejecting Render's outbound IP address. Fix it in MongoDB Atlas:

1. Open your Render service dashboard.
2. Open **Connect** in the upper-right corner.
3. Open the **Outbound** tab and copy the outbound IP ranges.
4. In MongoDB Atlas, open **Network Access**.
5. Add those Render outbound IP ranges.
6. Wait 1-2 minutes, then redeploy the Render service.

For quick development testing only, Atlas can allow `0.0.0.0/0`, but do not use that as a production security setting.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request.

## License

This project is licensed under the ISC License.
