# Budgetwise

Budgetwise is a full-stack expense tracker for recording daily spending, managing recurring expenses, viewing analytics, and using machine learning to suggest categories. The app is built with a React/Vite frontend, a Node/Express API, PostgreSQL via Prisma, and a Python Flask ML service.

## Features

- Email/password signup and login with JWT authentication.
- Password hashing with bcrypt and basic login rate limiting.
- Session idle timeout handling on the client and server.
- Profile management with name, email, and avatar image support.
- Expense create, read, update, and delete flows.
- Recurring expenses with daily, weekly, monthly, and yearly frequencies.
- Recurring end modes: forever, count-based, or until a date.
- Automatic materialization of due recurring expenses.
- Date filtering and category filtering for expense lists.
- Analytics totals, category breakdowns, and trend grouping.
- Dark mode support.
- INR currency formatting.
- ML-powered category prediction from expense title and amount.
- User-specific model training once enough expenses exist.
- Receipt scanning flow that sends receipt images to the ML/OCR service.
- Production deployment support for Render and Vercel.

## Tech Stack

### Frontend

- React 18
- Vite 5
- Tailwind CSS 4
- Chart.js
- Flatpickr

### Backend

- Node.js
- Express 5
- Prisma 6
- PostgreSQL
- JWT
- bcryptjs

### ML Service

- Python
- Flask
- scikit-learn
- OpenCV
- pytesseract
- OpenAI-compatible extraction flow for OCR post-processing

## Repository Layout

```text
.
├── src/                    # React app source
│   ├── components/         # Reusable UI components
│   ├── data/               # Category keyword data
│   ├── hooks/              # App, analytics, expense, and profile hooks
│   ├── layout/             # Navbar and status banner
│   ├── lib/                # API, auth, and category helpers
│   ├── pages/              # Auth, add expense, expenses, analytics, profile
│   ├── App.jsx             # Main app shell
│   └── main.jsx            # React entrypoint
├── server/                 # Express API
│   ├── config/             # Database config
│   ├── controllers/        # Auth, expense, recurring expense logic
│   ├── middleware/         # JWT/session auth middleware
│   ├── models/             # Server-side model helpers
│   ├── prisma/             # Prisma schema and migrations
│   ├── routes/             # API route modules
│   ├── utils/              # Logger
│   └── server.js           # API entrypoint and ML sidecar manager
├── ml-service/             # Flask ML/OCR service
│   ├── OCR/                # Receipt OCR and extraction pipeline
│   ├── notebooks/          # Model training notebook
│   ├── app.py              # Flask service entrypoint
│   ├── category_predictor.py
│   └── requirements.txt
├── scripts/                # Utility scripts
├── dist/                   # Generated frontend build output
├── index.html              # Vite HTML entry
├── package.json            # Frontend/root scripts
├── render.yaml             # Render deployment config
├── vercel.json             # Vercel rewrite config
└── vite.config.js
```

## Prerequisites

- Node.js 18+ for local development. Render is configured for Node 20.
- npm.
- Python 3.8+.
- PostgreSQL.
- Tesseract OCR installed locally if you use receipt scanning.

## Quick Start

Run the three project parts in separate terminals during local development.

### 1. Install Frontend Dependencies

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

Create `server/.env` from `server/.env.example` and set at least:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=budgetwise_app
JWT_SECRET=replace-with-strong-random-secret
```

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Start the API:

```bash
npm run start
```

The backend runs at:

```text
http://localhost:5000
```

### 3. Install ML Service Dependencies

From the repository root:

```bash
cd ml-service
python -m venv .venv
```

Activate the virtual environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the ML service manually:

```bash
python app.py
```

The ML service runs at:

```text
http://127.0.0.1:5001
```

The Node server can also spawn the ML service internally when `server/server.js` starts. For local development, keeping the ML service running in its own terminal is often easier to debug.

## Environment Variables

### Frontend `.env`

The root `.env.example` contains:

```env
VITE_API_BASE=https://your-render-backend.onrender.com/api
VITE_SESSION_IDLE_MINUTES=15
```

Use `VITE_API_BASE` when the frontend and backend are hosted on different origins. In same-origin production, the frontend defaults to `/api`.

On Vercel hosts, the app uses same-origin `/api` so `vercel.json` can rewrite requests to the backend URL listed in that file.

### Backend `server/.env`

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=budgetwise_app
JWT_SECRET=replace-with-strong-random-secret
JWT_EXPIRES_IN=7d
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15
SESSION_IDLE_MINUTES=15
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_RETRIES=3
ML_PORT=5001
PYTHON_EXECUTABLE=python3
CORS_ORIGINS=http://127.0.0.1:5173,http://127.0.0.1:4173
PORT=5000
```

Important backend variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `JWT_SECRET`: Required for signup/login token generation.
- `JWT_EXPIRES_IN`: JWT expiry, default `7d`.
- `LOGIN_MAX_ATTEMPTS`: Failed login attempts before lockout.
- `LOGIN_LOCK_MINUTES`: Login lockout window.
- `SESSION_IDLE_MINUTES`: Idle-session timeout used by auth middleware.
- `OPENAI_API_KEY`: Required for receipt OCR extraction.
- `OPENAI_MODEL`: Model name used by OCR extraction code.
- `ML_PORT`: Port for the Flask ML service.
- `PYTHON_EXECUTABLE`: Python executable used when Node starts the ML sidecar.
- `CORS_ORIGINS`: Comma-separated allowed frontend origins.
- `PORT`: Express API port.

### ML Service Variables

- `ML_PORT`: Flask port. Defaults to `5001`.
- `PORT`: Fallback Flask port if `ML_PORT` is not set.
- `FLASK_DEBUG`: Set to `1` for Flask debug mode.
- `ML_MODEL_PATH`: Model artifact path. Defaults to `model.pkl`.

`ML_MODEL_PATH` can include `{user_id}` for per-user model files:

```env
ML_MODEL_PATH=models/model_{user_id}.pkl
```

## Root Scripts

Run these from the repository root.

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Builds the React app into `dist/`.

```bash
npm run preview
```

Previews the production frontend build.

```bash
npm run start
```

Starts `server/server.js` from the repository root.

```bash
npm run start:server
```

Runs the backend package start script.

```bash
npm run build:full
```

Builds the frontend and generates the Prisma client.

## Backend Scripts

Run these from `server/`.

```bash
npm run start
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:studio
```

The backend `test` script is currently a placeholder.

## Database

Prisma uses PostgreSQL. The schema includes:

- `User`: account profile, email, password hash, avatar data URL.
- `Expense`: title, amount, category, creation date, owner, optional recurring source.
- `RecurringExpense`: recurring template and schedule state.
- `RecurrenceFrequency`: daily, weekly, monthly, yearly.
- `RecurrenceEndType`: forever, count, until date.

Useful commands:

```bash
cd server
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

For production deploys:

```bash
npm run prisma:migrate:deploy
```

## API Reference

Most API routes require a JWT bearer token:

```http
Authorization: Bearer <token>
```

### Auth

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create a user and return a token. |
| `POST` | `/api/auth/login` | Log in and return a token. |
| `GET` | `/api/auth/profile` | Get the current user profile. |
| `PATCH` | `/api/auth/profile` | Update name, email, and avatar. |
| `POST` | `/api/auth/logout` | Invalidate the current auth session server-side. |

### Expenses

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/expenses` | List expenses for the authenticated user. |
| `POST` | `/api/expenses` | Create an expense. |
| `PUT` | `/api/expenses/:id` | Update an expense. |
| `DELETE` | `/api/expenses/:id` | Delete an expense. |

`GET /api/expenses` supports:

- `from`: start date.
- `to`: end date.
- `groupBy=daily`
- `groupBy=weekly`
- `groupBy=monthly`

### Recurring Expenses

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/recurring-expenses` | Create a recurring expense. |
| `GET` | `/api/recurring-expenses` | List active recurring expenses. |
| `GET` | `/api/recurring-expenses/:id` | Get one recurring expense. |
| `PUT` | `/api/recurring-expenses/:id` | Update a recurring expense. |
| `DELETE` | `/api/recurring-expenses/:id` | Delete a recurring expense. |

Supported recurring frequencies:

- `daily`
- `weekly`
- `monthly`
- `yearly`

Supported end types:

- `forever`
- `count`
- `until_date`

### ML and OCR

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/train-model` | Train the current user's category model from stored expenses. |
| `POST` | `/api/predict-category` | Predict a category from title and amount. |
| `GET` | `/api/ml-health` | Check the Flask ML service through the backend. |
| `POST` | `/api/process-receipt` | Process a receipt image through OCR and extraction. |

The backend proxies ML requests to the internal Flask service at `http://127.0.0.1:<ML_PORT>`.

## Category Prediction Flow

The Add Expense page can auto-suggest a category.

Requirements:

- The user must be logged in.
- The backend must be running.
- The ML service must be running or startable by the backend.
- The user must have at least 10 expenses for model training.
- Leave category unselected so manual selection does not override prediction.
- Type a title with at least 3 characters and wait about 500 ms.

The frontend calls:

```text
POST /api/train-model
POST /api/predict-category
```

Predictions with confidence below `0.6` are ignored by the frontend. If prediction fails, the expense form remains usable.

## Receipt Scanning

Receipt scanning is exposed from the Add Expense page and through:

```text
POST /api/process-receipt
```

Request body:

```json
{
  "image_b64": "data:image/jpeg;base64,..."
}
```

The backend forwards the image to the ML service. The ML service:

1. Decodes the base64 image.
2. Preprocesses it with OpenCV.
3. Extracts text with Tesseract.
4. Uses the OCR extraction flow to identify receipt data.

For local receipt scanning:

- Install Tesseract OCR.
- Ensure `pytesseract` can find the Tesseract binary.
- Set `OPENAI_API_KEY` if the extraction flow requires it.

On Windows, `ml-service/OCR/ocr.py` includes a common default Tesseract path:

```text
C:\Program Files\Tesseract-OCR\tesseract.exe
```

Adjust your local Tesseract installation if needed.

## ML Model Training

The ML service includes a notebook workflow for training and exporting a model.

From repository root:

```bash
cd ml-service
python -m venv .venv
```

Activate and install notebook dependencies.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.notebook.txt
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.notebook.txt
```

Prepare training data:

1. Copy `ml-service/training_expenses.sample.json` to `ml-service/training_expenses.json`.
2. Replace sample rows with real labeled expenses.

Run:

```bash
jupyter notebook notebooks/train_and_export_model.ipynb
```

Run all cells. Expected outputs:

- `ml-service/model.pkl`
- `ml-service/model_metrics.json`

Select model artifact behavior:

```env
ML_MODEL_PATH=model.pkl
```

or:

```env
ML_MODEL_PATH=models/model_{user_id}.pkl
```

Restart the service after changing model artifacts.

## Development Workflow

Typical local workflow:

1. Start PostgreSQL.
2. Start the backend from `server/`.
3. Start the ML service from `ml-service/`.
4. Start the frontend from the repository root.
5. Open `http://localhost:5173`.

Health checks:

```bash
curl http://localhost:5000/api/ml-health
curl http://127.0.0.1:5001/health
```

Production build:

```bash
npm run build
npm run start
```

Do not manually edit `dist/`; it is generated by Vite.

## Deployment

### Render Same-Service Deployment

`render.yaml` defines one Render web service named `budgetwise`.

The Render build command:

1. Creates `ml-service/.venv`.
2. Installs ML Python dependencies.
3. Installs root npm dependencies.
4. Installs server npm dependencies.
5. Builds the frontend.
6. Generates Prisma client.
7. Runs Prisma deploy migrations.

The Render start command is:

```bash
npm --prefix server run start
```

The Node backend starts the Flask ML service as a sidecar process and talks to it on loopback.

Set secret environment variables in Render:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `OPENAI_API_KEY` if receipt scanning is needed

Render defaults from `render.yaml`:

- `NODE_VERSION=20`
- `JWT_EXPIRES_IN=7d`
- `LOGIN_MAX_ATTEMPTS=5`
- `LOGIN_LOCK_MINUTES=15`
- `SESSION_IDLE_MINUTES=15`
- `ML_PORT=5001`
- `PYTHON_EXECUTABLE=/opt/render/project/src/ml-service/.venv/bin/python`

The health check path is:

```text
/api/ml-health
```

### Vercel Frontend Deployment

Use Vercel when deploying the frontend separately from the backend.

1. Import the repository in Vercel.
2. Use the repository root as the project directory.
3. Set build command to `npm run build`.
4. Set output directory to `dist`.
5. Update `vercel.json` so the `/api/:path*` rewrite points to your backend:

```json
{
  "source": "/api/:path*",
  "destination": "https://your-render-backend.onrender.com/api/:path*"
}
```

6. Optionally set:

```env
VITE_SESSION_IDLE_MINUTES=15
```

7. Add the Vercel domain to backend `CORS_ORIGINS`.

`vercel.json` rewrites frontend `/api/*` calls to the backend. The current file contains a concrete Render destination, so change it when deploying your own backend.

## Troubleshooting

### Login Fails With "Server Auth Is Not Configured"

Set `JWT_SECRET` in `server/.env` or the deployment environment.

### API Requests Fail With CORS Errors

Add the frontend origin to `CORS_ORIGINS`.

Example:

```env
CORS_ORIGINS=http://127.0.0.1:5173,https://your-frontend.vercel.app
```

Restart the backend after changing environment variables.

### Prisma Cannot Connect

Check:

- `DATABASE_URL` is set.
- PostgreSQL is running.
- The database exists.
- Network access is allowed for deployed services.
- The schema in the URL matches your intended Prisma schema.

Then run:

```bash
cd server
npx prisma generate
npx prisma migrate dev
```

### Prediction Is Not Showing

Check:

- You are logged in.
- Backend is running on port `5000`.
- ML service is running on port `5001`, or the backend can spawn it.
- The account has at least 10 expenses for training.
- The expense title has at least 3 characters.
- No category has been manually selected.
- The prediction confidence is at least `0.6`.

### ML Health Check Fails

Run:

```bash
curl http://127.0.0.1:5001/health
```

If that fails:

- Activate the ML virtual environment.
- Install `ml-service/requirements.txt`.
- Confirm `ML_PORT=5001`.
- Confirm the backend `PYTHON_EXECUTABLE` points to an interpreter with Flask, scikit-learn, and joblib installed.

### Receipt Scanning Fails

Check:

- `OPENAI_API_KEY` is set if extraction needs it.
- Tesseract OCR is installed.
- `pytesseract` can find the Tesseract executable.
- The uploaded image is valid base64.
- The request body stays within the backend JSON limit.

### Vite Reloads When ML Artifacts Change

Model artifact updates such as `ml-service/model.pkl` can trigger reloads if watched. The project is configured to ignore ML artifacts in Vite watch settings and `.gitignore`.

## Generated and Local Files

These files/directories are generated or local-only:

- `node_modules/`
- `server/node_modules/`
- `.venv/`
- `ml-service/.venv/`
- `dist/`
- ML model artifacts such as `model.pkl`
- Local `.env` files

## Notes

- Current React development uses the root app plus `server/` and `ml-service/`.
- The frontend stores auth session details in local storage.
- Backend auth middleware clears invalid client sessions on `401`.
- Expense reads materialize due recurring expenses before returning data.
- The backend has no formal automated test suite configured yet; several ad hoc server test scripts are present under `server/`.
