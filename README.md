# Budgetwise React

Budgetwise is an expense tracker with a React frontend, a Node/Express API, and a Python ML service for category prediction.

## Repository Layout

- Root React app: `./`
- Active backend API for React: `./server`
- ML service: `./ml-service`

If you are working on the current React app, use the root app plus `server` and `ml-service`.

## Prerequisites

- Node.js 18+
- Python 3.8+
- PostgreSQL

## Setup

### 1) Frontend (React)

From repository root:

```bash
npm install
npm run dev
```

Frontend runs at:

- `http://localhost:5173`

### 2) Backend API

From repository root:

```bash
cd server
npm install
```

Create `server/.env` with at least:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=replace-this-in-production
```

Run Prisma and start the API:

```bash
npx prisma migrate dev
node server.js
```

Backend runs at:

- `http://localhost:5000`

### 3) ML Service

From repository root:

```bash
cd ml-service
python -m venv .venv
```

Activate the virtual environment:

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies and run:

```bash
pip install -r requirements.txt
python app.py
```

ML service runs at:

- `http://127.0.0.1:5001`

## React + ML Prediction Flow

The Add Expense form in React can auto-suggest a category.

Requirements:

- You must be logged in.
- Backend and ML service must be running.
- Leave category unselected so manual selection does not override prediction.
- Type a title with at least 3 characters and wait about 500ms.

Key endpoints used:

- `POST /api/train-model`
- `POST /api/predict-category`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`

## Scripts (Root)

From repository root:

- `npm run dev` - start Vite dev server
- `npm run build` - create production build in `dist`
- `npm run preview` - preview production build
- `npm run start` - run production server from root
- `npm run start:server` - run server package start script
- `npm run build:full` - build frontend + generate Prisma client

## Deployment (First Run)

The repository now includes:

- `render.yaml` for Render deployment
- `server/.env.example` with required backend variables

### Deploy on Render

1. Push your latest branch to GitHub.
2. In Render, create a new Web Service from this repository.
3. Render should auto-detect `render.yaml`.
4. Set secret env vars in Render dashboard:
	- `DATABASE_URL`
	- `JWT_SECRET`
	- `ML_SERVICE_URL` (if ML runs on a separate host)
	- `CORS_ORIGINS` (only needed if frontend is hosted on another domain)
5. Deploy and open the service URL.

Notes:

- Server listens on `process.env.PORT` in production.
- Frontend uses relative `/api` base in production.
- If you deploy frontend and backend on the same service/domain, CORS is minimal.

## Build Output

- `index.html` at root is the Vite entry template for development.
- `dist/` is generated output for production builds.

Do not manually edit files in `dist`.

## Troubleshooting

### Prediction not showing

1. Ensure `server/server.js` is running on port 5000.
2. Ensure `ml-service/app.py` is running on port 5001.
3. Re-login if API calls return 401.
4. Restart backend after backend code changes.

### Vite page reload loop from ML model updates

Model artifact updates (such as `ml-service/model.pkl`) can trigger reloads if watched by Vite.
The project is configured to ignore ML artifacts in Vite watch settings and `.gitignore`.

## Notes

- For current React development, prefer root app + `server` + `ml-service`.
