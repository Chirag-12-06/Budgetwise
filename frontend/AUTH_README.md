# Budgetwise Authentication System

## ✅ Features Implemented

### 1. **Authentication Pages**
- **Login Page** - [auth.html](auth.html)
- **Signup Page** - Same page with tab switching
- Beautiful gradient design with dark mode support

### 2. **Backend APIs**
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout user

### 3. **User Management**
- Each user gets a unique ID stored in localStorage
- User preferences isolated per account
- Separate ML model learning for each user

### 4. **Security Features**
- Password validation (minimum 6 characters)
- Email validation
- Token-based authentication
- User data stored securely

## 🚀 How to Use

### For Users:
1. Visit [auth.html](http://localhost:5500/auth.html)
2. **Signup**: Create an account with name, email, and password
3. **Login**: Use your credentials to access the app
4. Your expenses and preferences are saved per account

### For Developers:

#### Start the servers:
```bash
# Backend
cd expense-tracker-backend
npm start

# ML Service  
cd ml-service
python app.py
```

#### Test Authentication:
1. Open auth.html in browser
2. Create a test account
3. Login and start tracking expenses
4. Your user ID is automatically used for ML preferences

## 📁 File Structure

```
frontend/
├── auth.html              # Login/Signup page
├── js/
│   ├── auth.js           # Authentication logic
│   └── user-id.js        # User ID management (updated)
expense-tracker-backend/
├── controllers/
│   └── authController.js # Auth endpoints
└── routes/
    └── authRoutes.js     # Auth routes
```

## 🔐 How It Works

1. **User Signs Up**: Account created with unique ID
2. **LocalStorage**: User data and token stored locally
3. **Auto-Login**: Token checked on page load
4. **ML Integration**: User ID passed to ML service for personalized learning
5. **Logout**: Clears user data, keeps anonymous ID for guest usage

## ⚡ Quick Demo

**Demo Credentials**: Use any email/password to quickly test the system!

The system currently uses in-memory storage for demo purposes. In production:
- Use a proper database (PostgreSQL, MongoDB)
- Hash passwords with bcrypt
- Implement JWT tokens
- Add email verification
- Add password reset functionality

## 🎨 Features

- ✅ Tab-based Login/Signup UI
- ✅ Real-time validation
- ✅ Success/error messages
- ✅ Dark mode support
- ✅ Responsive design
- ✅ User name display in navbar
- ✅ Logout functionality
- ✅ Per-user ML preferences
