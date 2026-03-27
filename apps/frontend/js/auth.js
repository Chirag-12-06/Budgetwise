// Authentication Logic
const API_BASE = 'http://localhost:5000/api';

// Dark mode handling
const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;

// Check for saved dark mode preference
if (localStorage.getItem('bw-dark') === '1') {
  html.classList.add('dark');
  document.body.classList.remove('light-mode');
  document.body.classList.add('dark-mode');
  darkModeToggle.textContent = '☀️';
} else {
  document.body.classList.add('light-mode');
  document.body.classList.remove('dark-mode');
  darkModeToggle.textContent = '🌙';
}

darkModeToggle.addEventListener('click', () => {
  html.classList.toggle('dark');
  
  if (html.classList.contains('dark')) {
    localStorage.setItem('bw-dark', '1');
    darkModeToggle.textContent = '☀️';
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  } else {
    localStorage.setItem('bw-dark', '0');
    darkModeToggle.textContent = '🌙';
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  }
});

// Tab switching
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

loginTab.addEventListener('click', () => {
  loginTab.className = 'flex-1 py-2 rounded-md font-medium transition-colors bg-white dark:bg-gray-800 text-indigo-600 shadow';
  signupTab.className = 'flex-1 py-2 rounded-md font-medium transition-colors text-gray-600 dark:text-gray-400';
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
});

signupTab.addEventListener('click', () => {
  signupTab.className = 'flex-1 py-2 rounded-md font-medium transition-colors bg-white dark:bg-gray-800 text-indigo-600 shadow';
  loginTab.className = 'flex-1 py-2 rounded-md font-medium transition-colors text-gray-600 dark:text-gray-400';
  signupForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store user data
      localStorage.setItem('bw-user', JSON.stringify(data.user));
      localStorage.setItem('bw-user-id', data.user.id);
      localStorage.setItem('bw-token', data.token);
      
      showStatus('Login successful! Redirecting...', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } else {
      showStatus(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showStatus('An error occurred. Please try again.', 'error');
  }
});

// Signup Form Handler
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    showStatus('Passwords do not match', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store user data
      localStorage.setItem('bw-user', JSON.stringify(data.user));
      localStorage.setItem('bw-user-id', data.user.id);
      localStorage.setItem('bw-token', data.token);
      
      showStatus('Account created successfully! Redirecting...', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } else {
      showStatus(data.message || 'Signup failed', 'error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showStatus('An error occurred. Please try again.', 'error');
  }
});

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('authStatus');
  status.textContent = message;
  status.className = `mt-4 p-3 rounded-md text-sm ${
    type === 'error' 
      ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' 
      : 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
  }`;
  status.classList.remove('hidden');
  
  if (type === 'success') {
    setTimeout(() => {
      status.classList.add('hidden');
    }, 3000);
  }
}

// Check if already logged in
if (localStorage.getItem('bw-token')) {
  window.location.href = 'index.html';
}
