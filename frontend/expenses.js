// Expenses page JavaScript
const API_BASE = 'http://localhost:5000/api';

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

// Fetch and display expenses
async function loadExpenses() {
  try {
    const response = await fetch(`${API_BASE}/expenses`);
    const expenses = await response.json();
    
    const expenseList = document.getElementById('expenseList');
    const emptyState = document.getElementById('emptyState');
    
    if (expenses.length === 0) {
      expenseList.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    
    emptyState.classList.add('hidden');
    
    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    expenseList.innerHTML = expenses.map(expense => {
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
      method: 'DELETE'
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
    'snacks': { label: 'Snacks & Coffee', icon: '<i class="fas fa-coffee"></i>', color: CATEGORY_COLORS['snacks'] },
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
loadExpenses();
