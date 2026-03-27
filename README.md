# 💰 Budgetwise - Intelligent Expense Tracker

A full-stack expense tracking application with AI-powered category prediction, receipt scanning via OCR, and comprehensive analytics. Track your spending, analyze trends, and gain insights into your financial habits.

![Budgetwise](https://img.shields.io/badge/License-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)

---

## 🌟 Features

### 💳 Expense Management
- **Add Expenses**: Quickly log expenses with title, amount, category, and date
- **Edit & Delete**: Modify or remove expenses from your history
- **Auto-Categorization**: ML-powered category suggestion based on expense title and amount
- **Receipt Scanning**: Upload receipt images for automated text extraction (Tesseract.js OCR)
- **Rich Categories**: 30+ predefined expense categories across multiple sections
  - Food & Dining
  - Transportation
  - Shopping
  - Entertainment
  - Utilities
  - And more...

### 📊 Analytics Dashboard
- **Line Charts**: Track daily, monthly, or yearly spending trends
- **Pie Charts**: Visualize expense distribution by category
- **Bubble Charts**: See spending patterns across categories
- **Category Breakdown**: Quick overview of spending by category
- **Total Spending**: Real-time calculation of total expenditure
- **Outlier Detection**: Identify unusual expenses automatically
- **Log Scale Visualization**: Better visualization of data with extreme values
- **Custom Date Ranges**: Filter expenses by date range (This Month, Last Month, This Year, Custom)

### 🔐 Authentication & Security
- **User Authentication**: Secure login and registration with JWT tokens
- **Password Hashing**: bcrypt encryption for password security
- **User Isolation**: Each user sees only their own expenses
- **Dark Mode**: Easy on the eyes UI with dark/light theme support

### 🤖 AI & Machine Learning
- **Category Prediction**: Automatically suggests categories with confidence scoring
- **Smart Learning**: Model improves with more user data
- **Confidence Thresholds**: Only applies predictions when confidence is high enough (≥60%)

### 🌙 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Toggle**: Switch between light and dark themes
- **Real-time Updates**: Changes reflect immediately across all views
- **Smooth Animations**: Polished transitions and interactions
- **Toast Notifications**: User-friendly status messages and feedback

---

## 🏗️ Architecture

```
Budgetwise/
├── apps/
│   ├── frontend/             # Vanilla JS frontend
│   ├── index.html           # Add expense page
│   ├── expenses.html        # View/edit expenses page
│   ├── analytics.html       # Analytics dashboard
│   ├── auth.html            # Login/Register page
│   ├── app.js              # Main application logic
│   ├── css/                # Stylesheets (Tailwind CSS)
│   └── js/                 # Utility scripts
│
│   ├── backend/              # Node.js/Express backend
│   ├── server.js           # Express server setup
│   ├── routes/             # API route handlers
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth middleware
│   ├── models/             # Data models
│   ├── config/             # Database configuration
│   └── prisma/             # Prisma schema & migrations
│
│   └── ml-service/          # Python ML service
    ├── app.py             # Flask application
    ├── category_predictor.py  # ML prediction logic
    ├── category_keywords.json # Category mapping
    └── requirements.txt    # Python dependencies
│
├── README.md
└── .gitignore
```

---

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://www.python.org/)
- **PostgreSQL** (14 or higher) - [Download](https://www.postgresql.org/)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/budgetwise.git
cd budgetwise
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies
npm install

# Setup environment variables
# Create a .env file with:
# DATABASE_URL=postgresql://user:password@localhost:5432/budgetwise
# JWT_SECRET=your-secret-key

# Run Prisma migrations
npx prisma migrate dev --name init

# Start the backend server
node server.js
# Server runs on http://localhost:5000
```

### 3. Setup ML Service

```bash
# Navigate to ml-service directory (from root)
cd apps/ml-service

# Create and activate Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Flask service
python app.py
# Service runs on http://127.0.0.1:5001
```

### 4. Setup Frontend

```bash
# Navigate to frontend directory (from root)
cd apps/frontend

# Install dependencies
npm install

# Start Tailwind CSS watch (for development)
npm run dev

# Serve the frontend
# Use Live Server (VS Code extension) or:
# python -m http.server 5500
```

### 5. Access the Application

Open your browser and navigate to:
- **Frontend**: `http://127.0.0.1:5500`
- **Backend API**: `http://localhost:5000/api`
- **ML Service**: `http://127.0.0.1:5001/api`

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Structure and markup
- **CSS3 & Tailwind CSS** - Styling and responsive design
- **JavaScript (ES6+)** - Application logic
- **Chart.js** - Data visualization
- **Recharts** - Interactive charts
- **Tesseract.js** - OCR for receipt scanning
- **Flatpickr** - Date picker widget
- **Font Awesome** - Icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Prisma ORM** - Database abstraction layer
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **JSON Web Tokens (JWT)** - Authentication

### ML Service
- **Python** - Programming language
- **Flask** - Web framework
- **scikit-learn** - Machine learning
- **NumPy** - Numerical computing
- **googletrans** - Language translation support

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/logout         - Logout user
```

### Expenses
```
GET    /api/expenses            - Get all expenses
GET    /api/expenses/:id        - Get specific expense
POST   /api/expenses            - Add new expense
PUT    /api/expenses/:id        - Update expense
DELETE /api/expenses/:id        - Delete expense
POST   /api/expenses/train-model - Train ML model
```

### ML Predictions
```
POST   /api/predict-category    - Predict expense category
```

---

## 📊 Database Schema

### User Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Expense Table
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50),
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 Usage Guide

### Adding an Expense
1. Click **"Add Expense"** from the navigation
2. Enter the expense title and amount
3. Let the AI suggest a category, or manually select one
4. Optionally scan a receipt using the camera icon
5. Click **"Add Expense"** to save

### Scanning Receipts
1. Click **"Scan Receipt"** button
2. Select a receipt image from your device
3. The OCR will extract text and automatically parse amounts
4. Review and adjust extracted information
5. Confirm to add as expense

### Viewing Analytics
1. Navigate to **"Analytics"** page
2. Use time filters (Daily, Monthly, Yearly)
3. Select date range with quick filters or custom dates
4. Toggle **"Exclude Outliers"** to remove unusual expenses
5. Enable **"Log Scale"** for better visualization of varied data
6. Analyze trends and patterns in your spending

### Filtering Options
- **Date Range**: All Time, This Month, Last Month, This Year, Custom
- **Time Aggregation**: Daily, Monthly, Yearly
- **Data Filtering**: Exclude Outliers, Log Scale visualization

---

## 🔒 Security Features

- **JWT Authentication**: Stateless authentication with JWT tokens
- **Password Hashing**: bcrypt with salt for secure password storage
- **CORS Protection**: Configured CORS for authorized domains
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries via Prisma ORM
- **User Isolation**: Row-level security ensures users see only their data

---

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🐛 Troubleshooting

### Backend not connecting to database
- Verify PostgreSQL is running
- Check DATABASE_URL in .env file
- Ensure database and user exist

### Frontend not loading CSS
- Run `npm run dev` in `apps/frontend`
- Clear browser cache
- Check Tailwind CSS build output

### ML service not predicting
- Ensure Flask service is running on port 5001
- Check model is trained with sufficient data
- Verify `category_keywords.json` exists in `apps/ml-service`

### CORS errors
- Verify frontend URL is in CORS whitelist in backend
- Check request headers and origin
- Enable developer tools to see exact error

---

## 📈 Performance Tips

1. **Database Indexing**: Add indexes on frequently queried columns
2. **Pagination**: Implement expense list pagination for large datasets
3. **Caching**: Cache category predictions for common expense types
4. **Image Optimization**: Compress receipt images before upload
5. **Query Optimization**: Use Prisma select to fetch only needed fields

---

## 🚀 Deployment

### Deploy Backend
```bash
# Using Heroku
heroku create budgetwise-api
git push heroku main
```

### Deploy Frontend
```bash
# Using Vercel
npm install -g vercel
vercel
```

### Deploy ML Service
```bash
# Using Railway or Heroku
railway up
```

---

## 📝 Future Enhancements

- [ ] Budget goals and alerts
- [ ] Expense recurring patterns
- [ ] Multi-currency support
- [ ] Mobile app (React Native/Flutter)
- [ ] CSV export functionality
- [ ] Advanced ML models (seasonal trends)
- [ ] Social sharing for expense tips
- [ ] Bank account integration
- [ ] Tax report generation
- [ ] Real-time notifications

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 👥 Support

For support, send an email to support@budgetwise.com or open an issue on GitHub.

---

## 🙏 Acknowledgments

- Chart.js for data visualization
- Prisma for database management
- Tesseract.js for OCR capabilities
- scikit-learn for ML models
- Tailwind CSS for styling
- Font Awesome for icons

---

**Made with ❤️ by the Budgetwise Team**
