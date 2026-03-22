// Expenses page JavaScript
const API_BASE = 'http://localhost:5000/api';
let dateFilterMode = 'allTime'; // 'allTime', 'thisMonth', 'lastMonth', 'thisYear', 'custom'
let customDateFrom = null;
let customDateTo = null;
let expenseDates = new Set();
let flatpickrInstances = {};

function getAuthToken() {
  return localStorage.getItem('bw-token') || '';
}

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Centralized category color mapping (same as app.js)
const CATEGORY_COLORS = {
  'dining': '#f97316',
  'groceries': '#22c55e',
  'fruits': '#ef4444',
  'snacks': '#d97706',
  'liquor': '#9333ea',
  'juices': '#eab308',
  'beverages': '#14b8a6',
  'movies': '#db2777',
  'membership': '#6366f1',
  'hobbies': '#f43f5e',
  'sports': '#ea580c',
  'rent': '#2563eb',
  'electronics': '#475569',
  'furniture': '#b45309',
  'maintenance': '#4b5563',
  'supplies': '#06b6d4',
  'pets': '#65a30d',
  'services': '#8b5cf6',
  'childcare': '#f9a8d4',
  'clothing': '#d946ef',
  'health': '#dc2626',
  'personal': '#0ea5e9',
  'education': '#1d4ed8',
  'taxes': '#047857',
  'insurance': '#0f766e',
  'fuel': '#b91c1c',
  'parking': '#4f46e5',
  'cab': '#ca8a04',
  'flight': '#0284c7',
  'bicycle': '#16a34a',
  'bus': '#c2410c',
  'metro': '#7e22ce',
  'train': '#334155',
  'electricity': '#eab308',
  'water': '#3b82f6',
  'cleaning': '#0891b2',
  'gas': '#f97316',
  'internet': '#4338ca',
  'phone': '#15803d',
  'uncategorized': '#6b7280'
};

// Dark mode handling
const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;

// Check for saved dark mode preference
if (localStorage.getItem('bw-dark') === '1') {
  html.classList.add('dark');
  darkModeToggle.textContent = '☀️';
}

darkModeToggle.addEventListener('click', () => {
  html.classList.toggle('dark');
  if (html.classList.contains('dark')) {
    localStorage.setItem('bw-dark', '1');
    darkModeToggle.textContent = '☀️';
  } else {
    localStorage.setItem('bw-dark', '0');
    darkModeToggle.textContent = '🌙';
  }
});

// Update set of dates that have expenses
function updateExpenseDates(expenses) {
  expenseDates.clear();
  expenses.forEach(expense => {
    if (expense.createdAt) {
      expenseDates.add(expense.createdAt.split('T')[0]);
    }
  });

  Object.values(flatpickrInstances).forEach(instance => {
    if (instance && instance.redraw) {
      instance.redraw();
    }
  });
}

// Initialize flatpickr date pickers to match analytics calendar behavior
function initializeDatePickers() {
  const dateFromInput = document.getElementById('dateFrom');
  const dateToInput = document.getElementById('dateTo');

  if (typeof flatpickr === 'undefined') {
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    .flatpickr-day.has-expense {
      background: #4F46E5 !important;
      color: white !important;
      border-radius: 50%;
      font-weight: bold;
    }
    .flatpickr-day.has-expense:hover {
      background: #4338CA !important;
      color: white !important;
    }
  `;
  document.head.appendChild(style);

  const onDayCreate = function(dObj, dStr, fp, dayElem) {
    const date = dayElem.dateObj;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (expenseDates.has(dateStr)) {
      dayElem.classList.add('has-expense');
    }
  };

  if (dateFromInput) {
    flatpickrInstances.dateFrom = flatpickr(dateFromInput, {
      dateFormat: 'Y-m-d',
      onDayCreate
    });
  }

  if (dateToInput) {
    flatpickrInstances.dateTo = flatpickr(dateToInput, {
      dateFormat: 'Y-m-d',
      onDayCreate
    });
  }
}

// Initialize date filters
function initializeDateFilters() {
  const allTimeBtn = document.getElementById('filterAllTime');
  const thisMonthBtn = document.getElementById('filterThisMonth');
  const lastMonthBtn = document.getElementById('filterLastMonth');
  const thisYearBtn = document.getElementById('filterThisYear');
  const applyBtn = document.getElementById('applyDateRange');
  const dateFromInput = document.getElementById('dateFrom');
  const dateToInput = document.getElementById('dateTo');

  const buttons = { allTime: allTimeBtn, thisMonth: thisMonthBtn, lastMonth: lastMonthBtn, thisYear: thisYearBtn };

  function updateButtonStyles(activeMode) {
    Object.entries(buttons).forEach(([mode, btn]) => {
      if (!btn) return;

      if (mode === activeMode) {
        btn.className = 'px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white transition-colors';
      } else {
        btn.className = 'px-3 py-1.5 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors';
      }
    });
  }

  if (allTimeBtn) {
    allTimeBtn.addEventListener('click', () => {
      dateFilterMode = 'allTime';
      customDateFrom = null;
      customDateTo = null;
      updateButtonStyles('allTime');
      loadExpenses();
    });
  }

  if (thisMonthBtn) {
    thisMonthBtn.addEventListener('click', () => {
      dateFilterMode = 'thisMonth';
      customDateFrom = null;
      customDateTo = null;
      updateButtonStyles('thisMonth');
      loadExpenses();
    });
  }

  if (lastMonthBtn) {
    lastMonthBtn.addEventListener('click', () => {
      dateFilterMode = 'lastMonth';
      customDateFrom = null;
      customDateTo = null;
      updateButtonStyles('lastMonth');
      loadExpenses();
    });
  }

  if (thisYearBtn) {
    thisYearBtn.addEventListener('click', () => {
      dateFilterMode = 'thisYear';
      customDateFrom = null;
      customDateTo = null;
      updateButtonStyles('thisYear');
      loadExpenses();
    });
  }

  if (applyBtn && dateFromInput && dateToInput) {
    applyBtn.addEventListener('click', () => {
      const from = dateFromInput.value;
      const to = dateToInput.value;

      if (!from && !to) {
        showStatus('Choose at least one date to apply custom range', 'error');
        return;
      }

      if (from && to && new Date(from) > new Date(to)) {
        showStatus('From date cannot be later than To date', 'error');
        return;
      }

      dateFilterMode = 'custom';
      customDateFrom = from || null;
      customDateTo = to || null;
      updateButtonStyles(null);
      loadExpenses();
    });
  }
}

// Filter expenses by selected date range
function filterExpensesByDate(expenses) {
  if (dateFilterMode === 'allTime') {
    return expenses;
  }

  const now = new Date();
  let startDate;
  let endDate;

  if (dateFilterMode === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (dateFilterMode === 'lastMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (dateFilterMode === 'thisYear') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else if (dateFilterMode === 'custom') {
    if (customDateFrom) {
      startDate = new Date(customDateFrom);
      startDate.setHours(0, 0, 0, 0);
    }
    if (customDateTo) {
      endDate = new Date(customDateTo);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  return expenses.filter(expense => {
    const expenseDate = new Date(expense.createdAt);
    if (startDate && expenseDate < startDate) return false;
    if (endDate && expenseDate > endDate) return false;
    return true;
  });
}

// Fetch and display expenses
async function loadExpenses() {
  try {
    const response = await fetch(`${API_BASE}/expenses`, {
      headers: getAuthHeaders()
    });
    const expenses = await response.json();
    updateExpenseDates(expenses);
    
    const expenseList = document.getElementById('expenseList');
    const emptyState = document.getElementById('emptyState');
    
    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const filteredExpenses = filterExpensesByDate(expenses);
    const noExpensesInDateRange = filteredExpenses.length === 0 && expenses.length > 0;

    const emptyTitle = emptyState.querySelector('h3');
    const emptySubtitle = emptyState.querySelector('p');

    if (filteredExpenses.length === 0) {
      expenseList.innerHTML = '';
      emptyState.classList.remove('hidden');

      if (emptyTitle && emptySubtitle && noExpensesInDateRange) {
        emptyTitle.textContent = 'No expenses in selected range';
        emptySubtitle.textContent = 'Try a different filter or adjust the custom date range';
      } else if (emptyTitle && emptySubtitle) {
        emptyTitle.textContent = 'No expenses yet';
        emptySubtitle.textContent = 'Start tracking your expenses from the dashboard';
      }

      return;
    }
    
    emptyState.classList.add('hidden');
    
    expenseList.innerHTML = filteredExpenses.map(expense => {
      const categoryDisplay = getCategoryDisplay(expense.category);
      const date = new Date(expense.createdAt);
      const formattedDate = date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      return `
        <li class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4 flex-1">
              <div class="w-16 h-16 p-2 rounded-lg flex items-center justify-center text-white text-xl shadow-md" style="background-color: ${categoryDisplay.color}">${categoryDisplay.icon}</div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${expense.title}</h3>
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span><i class="fas fa-calendar mr-1"></i>${formattedDate}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">₹${expense.amount.toLocaleString('en-IN')}</span>
              <a href="index.html?edit=${expense.id}" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2">
                <i class="fas fa-edit"></i>
              </a>
              <button onclick="deleteExpense(${expense.id})" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </li>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading expenses:', error);
    showStatus('Failed to load expenses', 'error');
  }
}

// Delete expense
async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      showStatus('Expense deleted successfully', 'success');
      loadExpenses();
    } else {
      showStatus('Failed to delete expense', 'error');
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    showStatus('Failed to delete expense', 'error');
  }
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type === 'error' 
    ? 'bg-red-100 text-red-800 p-4 rounded-lg dark:bg-red-900 dark:text-red-300'
    : 'bg-green-100 text-green-800 p-4 rounded-lg dark:bg-green-900 dark:text-green-300';
  status.classList.remove('hidden');
  
  setTimeout(() => {
    status.classList.add('hidden');
  }, 3000);
}

// Category display helper
function getCategoryDisplay(categoryValue) {
  const categoryMap = {
    'dining': { label: 'Dining Out', icon: '<i class="fas fa-utensils"></i>', color: CATEGORY_COLORS['dining'] },
    'groceries': { label: 'Groceries', icon: '<i class="fas fa-shopping-basket"></i>', color: CATEGORY_COLORS['groceries'] },
    'fruits': { label: 'Fruits', icon: '<i class="fas fa-apple-alt"></i>', color: CATEGORY_COLORS['fruits'] },
    'snacks': { label: 'Snacks', icon: '<i class="fas fa-cookie-bite"></i>', color: CATEGORY_COLORS['snacks'] },
    'liquor': { label: 'Liquor & Spirits', icon: '<i class="fas fa-wine-glass-alt"></i>', color: CATEGORY_COLORS['liquor'] },
    'juices': { label: 'Juices', icon: '<i class="fas fa-glass-whiskey"></i>', color: CATEGORY_COLORS['juices'] },
    'beverages': { label: 'Non-Alcoholic Beverages', icon: '<i class="fas fa-mug-hot"></i>', color: CATEGORY_COLORS['beverages'] },
    'movies': { label: 'Movies', icon: '<i class="fas fa-film"></i>', color: CATEGORY_COLORS['movies'] },
    'membership': { label: 'Membership', icon: '<i class="fas fa-id-card"></i>', color: CATEGORY_COLORS['membership'] },
    'hobbies': { label: 'Hobbies', icon: '<i class="fas fa-palette"></i>', color: CATEGORY_COLORS['hobbies'] },
    'sports': { label: 'Sports & Recreation', icon: '<i class="fas fa-basketball-ball"></i>', color: CATEGORY_COLORS['sports'] },
    'rent': { label: 'Rent & Mortgage', icon: '<i class="fas fa-home"></i>', color: CATEGORY_COLORS['rent'] },
    'electronics': { label: 'Electronics', icon: '<i class="fas fa-tv"></i>', color: CATEGORY_COLORS['electronics'] },
    'furniture': { label: 'Furniture & Decor', icon: '<i class="fas fa-couch"></i>', color: CATEGORY_COLORS['furniture'] },
    'maintenance': { label: 'Maintenance & Repairs', icon: '<i class="fas fa-tools"></i>', color: CATEGORY_COLORS['maintenance'] },
    'supplies': { label: 'Household Supplies', icon: '<i class="fas fa-box-open"></i>', color: CATEGORY_COLORS['supplies'] },
    'pets': { label: 'Pets', icon: '<i class="fas fa-paw"></i>', color: CATEGORY_COLORS['pets'] },
    'services': { label: 'Services', icon: '<i class="fas fa-concierge-bell"></i>', color: CATEGORY_COLORS['services'] },
    'childcare': { label: 'Childcare', icon: '<i class="fas fa-baby"></i>', color: CATEGORY_COLORS['childcare'] },
    'clothing': { label: 'Clothing & Accessories', icon: '<i class="fas fa-tshirt"></i>', color: CATEGORY_COLORS['clothing'] },
    'health': { label: 'Healthcare', icon: '<i class="fas fa-heartbeat"></i>', color: CATEGORY_COLORS['health'] },
    'personal': { label: 'Personal Care', icon: '<i class="fas fa-shower"></i>', color: CATEGORY_COLORS['personal'] },
    'education': { label: 'Education', icon: '<i class="fas fa-graduation-cap"></i>', color: CATEGORY_COLORS['education'] },
    'taxes': { label: 'Taxes', icon: '<i class="fas fa-receipt"></i>', color: CATEGORY_COLORS['taxes'] },
    'insurance': { label: 'Insurance', icon: '<i class="fas fa-shield-alt"></i>', color: CATEGORY_COLORS['insurance'] },
    'fuel': { label: 'Fuel', icon: '<i class="fas fa-gas-pump"></i>', color: CATEGORY_COLORS['fuel'] },
    'parking': { label: 'Parking', icon: '<i class="fas fa-parking"></i>', color: CATEGORY_COLORS['parking'] },
    'cab': { label: 'Cab', icon: '<i class="fas fa-taxi"></i>', color: CATEGORY_COLORS['cab'] },
    'flight': { label: 'Flight', icon: '<i class="fas fa-plane"></i>', color: CATEGORY_COLORS['flight'] },
    'bicycle': { label: 'Bicycle', icon: '<i class="fas fa-bicycle"></i>', color: CATEGORY_COLORS['bicycle'] },
    'bus': { label: 'Bus', icon: '<i class="fas fa-bus"></i>', color: CATEGORY_COLORS['bus'] },
    'metro': { label: 'Metro', icon: '<i class="fas fa-subway"></i>', color: CATEGORY_COLORS['metro'] },
    'train': { label: 'Train', icon: '<i class="fas fa-train"></i>', color: CATEGORY_COLORS['train'] },
    'electricity': { label: 'Electricity', icon: '<i class="fas fa-bolt"></i>', color: CATEGORY_COLORS['electricity'] },
    'water': { label: 'Water', icon: '<i class="fas fa-tint"></i>', color: CATEGORY_COLORS['water'] },
    'cleaning': { label: 'Cleaning', icon: '<i class="fas fa-broom"></i>', color: CATEGORY_COLORS['cleaning'] },
    'gas': { label: 'Gas', icon: '<i class="fas fa-burn"></i>', color: CATEGORY_COLORS['gas'] },
    'internet': { label: 'Internet & Cable', icon: '<i class="fas fa-wifi"></i>', color: CATEGORY_COLORS['internet'] },
    'phone': { label: 'Phone', icon: '<i class="fas fa-phone"></i>', color: CATEGORY_COLORS['phone'] },
    'uncategorized': { label: 'Uncategorized', icon: '<i class="fas fa-question-circle"></i>', color: CATEGORY_COLORS['uncategorized'] }
  };
  
  if (categoryMap[categoryValue]) {
    return categoryMap[categoryValue];
  }
  
  return {
    label: categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1),
    icon: '<i class="fas fa-question-circle"></i>',
    color: CATEGORY_COLORS['uncategorized']
  };
}

// Load expenses on page load
if (!localStorage.getItem('bw-token')) {
  window.location.href = 'auth.html';
}

initializeDatePickers();
initializeDateFilters();
loadExpenses();
