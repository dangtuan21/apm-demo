# APM Chat Application

A simple React frontend + Node.js backend application with a chat endpoint.

## Project Structure

```
apm/
├── backend/          # Node.js Express server
│   ├── package.json
│   └── server.js
├── frontend/         # React application
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── index.js
│       └── index.css
└── README.md
```

## Features

- **Backend**: REST API with `/chat` endpoint that accepts a `name` parameter and returns `Hi <name>`
- **Frontend**: React app with input form that calls the backend and displays the response

## Setup & Running

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend will run on http://localhost:8050

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend will run on http://localhost:3050

## API Endpoints

### GET /chat
- **Parameter**: `name` (query parameter)
- **Response**: `{ "message": "Hi <name>" }`
- **Example**: `GET /chat?name=John` → `{ "message": "Hi John" }`

### GET /health
- **Response**: `{ "status": "OK", "timestamp": "..." }`

## Usage

1. Start both backend and frontend servers
2. Open http://localhost:3050 in your browser
3. Enter a name in the input field
4. Click "Submit" to see the greeting response

## Next Steps

This setup is ready for adding Grafana + Prometheus monitoring as discussed earlier!
