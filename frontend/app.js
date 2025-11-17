const API_BASE = 'http://localhost:5000/api/expenses';
const ML_API = 'http://127.0.0.1:5001/api';
let editingId = null;
let currentFilter = 'daily'; // Track current chart filter
let excludeOutliers = false;
let useLogScale = false;
let dateFilterMode = 'allTime'; // 'allTime', 'thisMonth', 'lastMonth', 'thisYear', 'custom'
let customDateFrom = null;
let customDateTo = null;
let expenseDates = new Set(); // Track dates with expenses
let flatpickrInstances = {}; // Store flatpickr instances
let isModelTrained = false; // Track if ML model is trained

// Detect outliers using IQR (Interquartile Range) method
function detectOutliers(data) {
  if (data.length < 2) return { outliers: [], threshold: null, hasOutliers: false };
  
  // For small datasets (2-3 points), use a simpler approach
  if (data.length <= 3) {
    const sorted = [...data].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min;
    
    // If the max is more than 10x the min, consider it an outlier
    if (max / min > 10) {
      console.log('Small dataset outlier detected:', { min, max, ratio: max / min });
      return {
        outliers: [max],
        upperBound: min * 10,
        lowerBound: 0,
        hasOutliers: true
      };
    }
    
    // If range is very large relative to minimum value, flag it
    if (range > min * 5) {
      console.log('Large range detected:', { min, max, range });
      return {
        outliers: [max],
        upperBound: min * 5,
        lowerBound: 0,
        hasOutliers: true
      };
    }
    
    return { outliers: [], upperBound: max, lowerBound: min, hasOutliers: false };
  }
  
  // Standard IQR method for larger datasets
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  // Use 1.5 * IQR for outlier detection (standard method)
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers = data.filter(val => val < lowerBound || val > upperBound);
  
  console.log('Outlier detection:', {
    q1,
    q3,
    iqr,
    lowerBound,
    upperBound,
    outliers,
    dataLength: data.length
  });
  
  return {
    outliers,
    upperBound,
    lowerBound,
    hasOutliers: outliers.length > 0
  };
}

// Show outlier warning
function showOutlierWarning(outlierInfo, aggregated) {
  const warning = document.getElementById('outlierWarning');
  const message = document.getElementById('outlierMessage');
  
  if (!warning || !message) return;
  
  if (outlierInfo.hasOutliers) {
    const maxOutlier = Math.max(...outlierInfo.outliers);
    const count = outlierInfo.outliers.length;
    const total = Object.keys(aggregated).length;
    
    message.textContent = `Found ${count} outlier value${count > 1 ? 's' : ''} out of ${total} data points. Highest outlier: ₹${maxOutlier.toLocaleString('en-IN', { maximumFractionDigits: 2 })}. This may affect chart readability.`;
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }
}

// Update expense dates from all expenses
function updateExpenseDates(expenses) {
  expenseDates.clear();
  expenses.forEach(e => {
    if (e.createdAt) {
      const date = e.createdAt.split('T')[0]; // Get YYYY-MM-DD format
      expenseDates.add(date);
    }
  });
  
  console.log('Updated expense dates:', Array.from(expenseDates).sort());
  console.log('Total unique dates with expenses:', expenseDates.size);

  // Refresh all flatpickr instances to update highlighted dates
  Object.values(flatpickrInstances).forEach(fp => {
    if (fp && fp.redraw) {
      fp.redraw();
    }
  });
}

// Initialize flatpickr date pickers with expense date highlighting
function initializeDatePickers() {
  const dateInput = document.getElementById('date');
  const dateFromInput = document.getElementById('dateFrom');
  const dateToInput = document.getElementById('dateTo');

  // Custom CSS for highlighting dates with expenses
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

  // Main date input
  if (dateInput) {
    flatpickrInstances.date = flatpickr(dateInput, {
      dateFormat: 'Y-m-d',
      onDayCreate: function(dObj, dStr, fp, dayElem) {
        const date = dayElem.dateObj;
        // Use local date to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        if (expenseDates.has(dateStr)) {
          dayElem.classList.add('has-expense');
          console.log('Highlighting date:', dateStr);
        }
      },
      onReady: function() {
        console.log('Main date picker ready, expense dates:', expenseDates.size);
      }
    });
  }

  // Filter date inputs
  if (dateFromInput) {
    flatpickrInstances.dateFrom = flatpickr(dateFromInput, {
      dateFormat: 'Y-m-d',
      onDayCreate: function(dObj, dStr, fp, dayElem) {
        const date = dayElem.dateObj;
        // Use local date to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        if (expenseDates.has(dateStr)) {
          dayElem.classList.add('has-expense');
        }
      }
    });
  }

  if (dateToInput) {
    flatpickrInstances.dateTo = flatpickr(dateToInput, {
      dateFormat: 'Y-m-d',
      onDayCreate: function(dObj, dStr, fp, dayElem) {
        const date = dayElem.dateObj;
        // Use local date to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        if (expenseDates.has(dateStr)) {
          dayElem.classList.add('has-expense');
        }
      }
    });
  }
}


// Initialize chart options
function initializeChartOptions() {
  const excludeOutliersCheckbox = document.getElementById('excludeOutliers');
  const useLogScaleCheckbox = document.getElementById('useLogScale');
  
  if (excludeOutliersCheckbox) {
    excludeOutliersCheckbox.addEventListener('change', (e) => {
      excludeOutliers = e.target.checked;
      updateCharts();
    });
  }
  
  if (useLogScaleCheckbox) {
    useLogScaleCheckbox.addEventListener('change', (e) => {
      useLogScale = e.target.checked;
      updateCharts();
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

  // Update button styles
  function updateButtonStyles(activeMode) {
    Object.entries(buttons).forEach(([mode, btn]) => {
      if (btn) {
        if (mode === activeMode) {
          btn.className = 'px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white transition-colors';
        } else {
          btn.className = 'px-3 py-1.5 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors';
        }
      }
    });
  }

  // All Time
  if (allTimeBtn) {
    allTimeBtn.addEventListener('click', () => {
      dateFilterMode = 'allTime';
      customDateFrom = null;
      customDateTo = null;
      updateButtonStyles('allTime');
      updateCharts();
    });
  }

  // This Month
  if (thisMonthBtn) {
    thisMonthBtn.addEventListener('click', () => {
      dateFilterMode = 'thisMonth';
      customDateFrom = null;
      customDateTo = null;
      updateButtonStyles('thisMonth');
      updateCharts();
    });
  }

  // Last Month
  if (lastMonthBtn) {
    lastMonthBtn.addEventListener('click', () => {
      dateFilterMode = 'lastMonth';
      customDateFrom = null;
      customDateTo = null;
      updateButtonStyles('lastMonth');
      updateCharts();
    });
  }

  // This Year
  if (thisYearBtn) {
    thisYearBtn.addEventListener('click', () => {
      dateFilterMode = 'thisYear';
      customDateFrom = null;
      customDateTo = null;
      updateButtonStyles('thisYear');
      updateCharts();
    });
  }

  // Apply Custom Date Range
  if (applyBtn && dateFromInput && dateToInput) {
    applyBtn.addEventListener('click', () => {
      const from = dateFromInput.value;
      const to = dateToInput.value;
      
      if (from || to) {
        dateFilterMode = 'custom';
        customDateFrom = from || null;
        customDateTo = to || null;
        updateButtonStyles(null); // Deselect all quick filters
        updateCharts();
      }
    });
  }
}

// Initialize filter buttons
function initializeChartFilters() {
  const filterButtons = {
    daily: document.getElementById('filterDaily'),
    monthly: document.getElementById('filterMonthly'),
    yearly: document.getElementById('filterYearly')
  };

  Object.entries(filterButtons).forEach(([filter, button]) => {
    if (button) {
      button.addEventListener('click', () => {
        // Update active button styling
        Object.values(filterButtons).forEach(btn => {
          btn.classList.remove('bg-indigo-600', 'text-white');
          btn.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');
        });
        button.classList.add('bg-indigo-600', 'text-white');
        button.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');

        // Update filter and redraw charts
        currentFilter = filter;
        updateCharts();
      });
    }
  });
}

function initializeCustomSelect() {
  const categorySelect = document.getElementById('categorySelect');
  const categoryMenu = document.getElementById('categoryMenu');
  const categoryInput = document.getElementById('category');

  if (!categorySelect || !categoryMenu || !categoryInput) return;

  // Initialize display text if empty
  if (!categorySelect.innerHTML.trim()) {
    categorySelect.innerHTML = `<i class="fas fa-tags mr-2"></i> Category`;
  }

  // Toggle dropdown visibility
  categorySelect.addEventListener('click', (e) => {
    e.stopPropagation();
    categoryMenu.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!categorySelect.contains(e.target) && !categoryMenu.contains(e.target)) {
      categoryMenu.classList.add('hidden');
    }
  });

  // Select option
  categoryMenu.querySelectorAll('.category-option').forEach(option => {
    option.addEventListener('click', (evt) => {
      evt.stopPropagation();
      const value = option.dataset.value || '';
      const label = option.textContent.trim();
      // preserve icon if present in option
      const icon = option.querySelector('i') ? option.querySelector('i').outerHTML + ' ' : '';
      categorySelect.innerHTML = `${icon}${label}`;
      categoryInput.value = value;
      categoryMenu.classList.add('hidden');
    });
  });

  // Dark mode handling
  const dmToggle = document.getElementById('darkModeToggle');
  const htmlEl = document.documentElement;
  const saved = localStorage.getItem('bw-dark');
  if (saved === '1') htmlEl.classList.add('dark');
  if (dmToggle) {
    dmToggle.textContent = htmlEl.classList.contains('dark') ? '☀️' : '🌙';
    dmToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isDark = htmlEl.classList.toggle('dark');
      localStorage.setItem('bw-dark', isDark ? '1' : '0');
      dmToggle.textContent = isDark ? '☀️' : '🌙';
      // Update charts with new color scheme
      updateCharts();
    });
  }
}

async function addExpense() {
  try {
    setStatus('');
    const title = document.getElementById('title').value.trim();
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value.trim();
    const date = document.getElementById('date').value;

    if (!title || !amount || !category) {
      setStatus('Please fill in all required fields.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setStatus('Please enter a valid amount.');
      return;
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        title,
        amount: parseFloat(amount),
        category,
        date: date || new Date().toISOString().split('T')[0]
      })
    });

    if (!response.ok) throw new Error('Failed to add expense');
    setStatus('Expense added successfully.');
    document.getElementById('expenseForm').reset();
    document.getElementById('categorySelect').innerHTML = `<span><i class="fas fa-tags mr-2"></i>Category</span>`;
    await loadExpenses();
    await updateCharts();
    
    // Retrain model in background after adding expense
    trainModel();
  } catch (err) {
    setStatus('Error: ' + err.message);
  }
}

async function loadExpenses() {
  try {
    setStatus('');
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const expenses = await res.json();

    const list = document.getElementById('expenseList');
    list.innerHTML = '';

    expenses.forEach(e => {
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center bg-gray-50 px-6 py-5 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow';
      
      // Info div
      const infoDiv = document.createElement('div');
      infoDiv.className = 'flex-1 min-w-0 mr-4';
      infoDiv.innerHTML = `
        <div class="flex flex-wrap items-baseline gap-2">
          <span class="font-semibold text-indigo-600 dark:text-indigo-400 text-lg">${e.title}</span>
          <span class="text-gray-800 dark:text-white font-medium text-lg">₹${e.amount}</span>
          <span class="text-gray-600 text-sm dark:text-gray-400">(${e.category})</span>
          <span class="text-gray-500 text-xs dark:text-gray-500">${e.createdAt ? e.createdAt.split('T')[0] : ''}</span>
        </div>
      `;
      
      // Buttons div
      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'flex gap-3 flex-shrink-0';
      
      const editBtn = document.createElement('button');
      editBtn.className = 'px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-md text-sm font-medium transition-colors shadow-sm';
      editBtn.innerHTML = 'Edit';
      editBtn.onclick = () => editExpense(e.id);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'px-4 py-2 bg-red-500 hover:bg-red-600 text-black rounded-md text-sm font-medium transition-colors shadow-sm';
      deleteBtn.innerHTML = 'Delete';
      deleteBtn.onclick = () => deleteExpense(e.id);
      
      buttonsDiv.appendChild(editBtn);
      buttonsDiv.appendChild(deleteBtn);
      li.appendChild(infoDiv);
      li.appendChild(buttonsDiv);
      list.appendChild(li);
    });
  } catch (err) {
    setStatus('Failed to load expenses: ' + err.message);
  }
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setStatus('Deleted successfully.');
    await loadExpenses();
    await updateCharts();
  } catch (err) {
    setStatus('Delete failed: ' + err.message);
  }
}

async function editExpense(id) {
  try {
    // Use getExpenses to fetch all expenses, then find the one we need
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const expenses = await res.json();
    
    // Find the expense by ID
    const expense = expenses.find(e => e.id === id);
    if (!expense) {
      setStatus('Expense not found');
      return;
    }
    
    // Populate form with expense data
    document.getElementById('title').value = expense.title;
    document.getElementById('amount').value = expense.amount;
    document.getElementById('category').value = expense.category;
    
    // Update category dropdown display
    const categorySelect = document.getElementById('categorySelect');
    const categoryOption = document.querySelector(`[data-value="${expense.category}"]`);
    if (categoryOption) {
      const icon = categoryOption.querySelector('i') ? categoryOption.querySelector('i').outerHTML + ' ' : '';
      const label = categoryOption.textContent.trim();
      categorySelect.innerHTML = `${icon}${label}`;
    }
    
    if (expense.createdAt) {
      document.getElementById('date').value = expense.createdAt.split('T')[0];
    }
    
    // Change button to "Update" mode
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Update Expense';
    submitBtn.onclick = () => updateExpense(id);
    submitBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
    submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    
    // Scroll to form
    document.getElementById('expenseForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    setStatus('Edit failed: ' + err.message);
  }
}

async function updateExpense(id) {
  try {
    setStatus('');
    const title = document.getElementById('title').value.trim();
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value.trim();
    const date = document.getElementById('date').value;

    if (!title || !amount || !category) {
      setStatus('Please fill in all required fields.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setStatus('Please enter a valid amount.');
      return;
    }

    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        title,
        amount: parseFloat(amount),
        category,
        date: date || new Date().toISOString().split('T')[0]
      })
    });

    if (!response.ok) throw new Error('Failed to update expense');
    setStatus('Expense updated successfully.');
    
    // Reset form and button
    document.getElementById('expenseForm').reset();
    document.getElementById('categorySelect').innerHTML = `<span><i class="fas fa-tags mr-2"></i>Category</span>`;
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Add Expense';
    submitBtn.onclick = addExpense;
    submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    submitBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    
    await loadExpenses();
    await updateCharts();
  } catch (err) {
    setStatus('Update failed: ' + err.message);
  }
}

function setStatus(msg) {
  const s = document.getElementById('status');
  if (!s) return;
  s.textContent = msg || '';
  s.classList.remove('hidden');
  setTimeout(() => s.classList.add('hidden'), 3000);
}

// Chart instances (to prevent memory leaks)
let lineChartInstance = null;
let pieChartInstance = null;

// Filter expenses by date range
function filterExpensesByDate(expenses) {
  if (dateFilterMode === 'allTime') {
    return expenses;
  }

  const now = new Date();
  let startDate, endDate;

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

  return expenses.filter(e => {
    const expenseDate = new Date(e.createdAt);
    if (startDate && expenseDate < startDate) return false;
    if (endDate && expenseDate > endDate) return false;
    return true;
  });
}

// Aggregate expenses based on current filter
function aggregateExpenses(expenses, filterType) {
  const aggregated = {};

  expenses.forEach(e => {
    const amount = parseFloat(e.amount || 0);
    const date = new Date(e.createdAt);
    let key;

    if (filterType === 'daily') {
      // Group by date (YYYY-MM-DD)
      key = e.createdAt ? e.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
    } else if (filterType === 'monthly') {
      // Group by month (YYYY-MM)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      key = `${year}-${month}`;
    } else if (filterType === 'yearly') {
      // Group by year (YYYY)
      key = String(date.getFullYear());
    }

    aggregated[key] = (aggregated[key] || 0) + amount;
  });

  return aggregated;
}

// Format labels based on filter type
function formatLabel(key, filterType) {
  if (filterType === 'daily') {
    return key; // Already in YYYY-MM-DD format
  } else if (filterType === 'monthly') {
    const [year, month] = key.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  } else if (filterType === 'yearly') {
    return key; // Just the year
  }
  return key;
}

// Update total spending display
function updateTotalSpending(expenses) {
  const displayDiv = document.getElementById('totalSpendingDisplay');
  const amountSpan = document.getElementById('totalSpendingAmount');
  const periodSpan = document.getElementById('totalSpendingPeriod');
  
  if (!displayDiv || !amountSpan || !periodSpan) return;
  
  // Calculate total
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  
  // Show/hide based on whether a filter is active
  if (dateFilterMode !== 'allTime' || expenses.length > 0) {
    displayDiv.classList.remove('hidden');
    amountSpan.textContent = `₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    
    // Set period text
    let periodText = '';
    if (dateFilterMode === 'allTime') {
      periodText = `All time (${expenses.length} expenses)`;
    } else if (dateFilterMode === 'thisMonth') {
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      periodText = `${monthNames[now.getMonth()]} ${now.getFullYear()} (${expenses.length} expenses)`;
    } else if (dateFilterMode === 'lastMonth') {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      periodText = `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()} (${expenses.length} expenses)`;
    } else if (dateFilterMode === 'thisYear') {
      const now = new Date();
      periodText = `${now.getFullYear()} (${expenses.length} expenses)`;
    } else if (dateFilterMode === 'custom') {
      const parts = [];
      if (customDateFrom) parts.push(`from ${customDateFrom}`);
      if (customDateTo) parts.push(`to ${customDateTo}`);
      periodText = `${parts.join(' ')} (${expenses.length} expenses)`;
    }
    periodSpan.textContent = periodText;
  } else {
    displayDiv.classList.add('hidden');
  }
}

// Draw line chart with aggregation
async function drawLineChart() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    let expenses = await res.json();

    // Update expense dates for calendar highlighting
    updateExpenseDates(expenses);

    // Apply date filter
    expenses = filterExpensesByDate(expenses);

    if (expenses.length === 0) {
      const ctx = document.getElementById("lineChart");
      if (ctx) {
        if (lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = null;
      }
      updateTotalSpending(expenses);
      return;
    }

    // Update total spending display
    updateTotalSpending(expenses);

    // Aggregate expenses based on current filter
    const aggregated = aggregateExpenses(expenses, currentFilter);
    
    // Sort keys
    const sortedKeys = Object.keys(aggregated).sort();
    let amounts = sortedKeys.map(key => aggregated[key]);
    
    // Detect outliers
    const outlierInfo = detectOutliers(amounts);
    showOutlierWarning(outlierInfo, aggregated);
    
    // Filter out outliers if enabled
    let labels = sortedKeys.map(key => formatLabel(key, currentFilter));
    if (excludeOutliers && outlierInfo.hasOutliers) {
      const filtered = sortedKeys.filter((key, idx) => {
        const val = amounts[idx];
        return val >= outlierInfo.lowerBound && val <= outlierInfo.upperBound;
      });
      labels = filtered.map(key => formatLabel(key, currentFilter));
      amounts = filtered.map(key => aggregated[key]);
    }

    const ctx = document.getElementById("lineChart");
    if (!ctx) return;

    // Destroy previous chart instance
    if (lineChartInstance) {
      lineChartInstance.destroy();
    }

    // Determine chart title based on filter
    let chartTitle = 'Expense Trend';
    if (currentFilter === 'daily') chartTitle = 'Daily Expense Trend';
    else if (currentFilter === 'monthly') chartTitle = 'Monthly Expense Trend';
    else if (currentFilter === 'yearly') chartTitle = 'Yearly Expense Trend';

    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#E5E7EB' : '#111827';
    const gridColor = isDarkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    const lineColor = isDarkMode ? '#818CF8' : '#4F46E5'; // Lighter indigo for dark mode
    const pointBorderColor = isDarkMode ? '#FFFFFF' : '#4F46E5'; // White markers in dark mode

    // Calculate max value for proper scaling in log mode
    const maxAmount = Math.max(...amounts);
    // const suggestedMaxLog = useLogScale ? Math.pow(10, Math.ceil(Math.log10(maxAmount))) : undefined;
    const suggestedMaxLog = useLogScale ? maxAmount : undefined;

    lineChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)} Spending (₹)`,
            data: amounts,
            borderColor: lineColor,
            backgroundColor: isDarkMode ? 'rgba(129, 140, 248, 0.15)' : 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: pointBorderColor,
            pointBorderColor: pointBorderColor,
            pointBorderWidth: 2,
            pointHoverBackgroundColor: pointBorderColor,
            pointHoverBorderColor: pointBorderColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: chartTitle,
            font: { size: 16, weight: 'bold' },
            color: textColor
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function(context) {
                return 'Amount: ₹' + context.parsed.y.toLocaleString('en-IN', { maximumFractionDigits: 2 });
              }
            }
          },
          legend: {
            display: false
          }
        },
        interaction: {
          intersect: false,
        },
        scales: {
          y: {
            type: useLogScale ? 'logarithmic' : 'linear',
            beginAtZero: !useLogScale,
            ...(useLogScale && {
              afterBuildTicks: (scale) => {
                // Ensure max value is included as a tick
                const maxVal = Math.max(...amounts);
                if (!scale.ticks.some(t => t.value === maxVal)) {
                  scale.ticks.push({ value: maxVal });
                  // Sort ticks by value
                  scale.ticks.sort((a, b) => a.value - b.value);
                  // Limit to 10 ticks
                  if (scale.ticks.length > 10) {
                    // Keep first, last, and evenly distribute the rest
                    const first = scale.ticks[0];
                    const last = scale.ticks[scale.ticks.length - 1];
                    const step = Math.floor((scale.ticks.length - 2) / 8);
                    const middle = scale.ticks.slice(1, -1).filter((_, i) => i % step === 0).slice(0, 8);
                    scale.ticks = [first, ...middle, last];
                  }
                }
              }
            }),
            ticks: {
              callback: function(value) {
                return '₹' + value.toLocaleString('en-IN');
              },
              color: textColor,
              autoSkip: false,
              maxTicksLimit: useLogScale ? 10 : 8
            },
            grid: {
              color: gridColor
            }
          },
          x: {
            offset: true, // Offset labels to align with grid lines centered under points
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              display: false
            }
          }
        },
      },
    });
  } catch (err) {
    console.error('Error drawing line chart:', err);
  }
}

// Category display names and icons mapping
function getCategoryDisplay(categoryValue) {
  const categoryMap = {
    'dining': { label: 'Dining Out', icon: '<i class="fas fa-utensils"></i>' },
    'groceries': { label: 'Groceries', icon: '<i class="fas fa-shopping-basket"></i>' },
    'fruits': { label: 'Fruits', icon: '<i class="fas fa-apple-alt"></i>' },
    'snacks': { label: 'Snacks & Coffee', icon: '<i class="fas fa-coffee"></i>' },
    'liquor': { label: 'Liquor & Spirits', icon: '<i class="fas fa-wine-glass-alt"></i>' },
    'juices': { label: 'Juices', icon: '<i class="fas fa-glass-whiskey"></i>' },
    'beverages': { label: 'Non-Alcoholic Beverages', icon: '<i class="fas fa-mug-hot"></i>' },
    'movies': { label: 'Movies', icon: '<i class="fas fa-film"></i>' },
    'membership': { label: 'Membership', icon: '<i class="fas fa-id-card"></i>' },
    'music': { label: 'Music', icon: '<i class="fas fa-music"></i>' },
    'hobbies': { label: 'Hobbies', icon: '<i class="fas fa-palette"></i>' },
    'sports': { label: 'Sports & Recreation', icon: '<i class="fas fa-basketball-ball"></i>' },
    'rent': { label: 'Rent & Mortgage', icon: '<i class="fas fa-home"></i>' },
    'electronics': { label: 'Electronics', icon: '<i class="fas fa-tv"></i>' },
    'furniture': { label: 'Furniture & Decor', icon: '<i class="fas fa-couch"></i>' },
    'maintenance': { label: 'Maintenance & Repairs', icon: '<i class="fas fa-tools"></i>' },
    'supplies': { label: 'Household Supplies', icon: '<i class="fas fa-box-open"></i>' },
    'pets': { label: 'Pets', icon: '<i class="fas fa-paw"></i>' },
    'services': { label: 'Services', icon: '<i class="fas fa-concierge-bell"></i>' },
    'childcare': { label: 'Childcare', icon: '<i class="fas fa-baby"></i>' },
    'clothing': { label: 'Clothing & Accessories', icon: '<i class="fas fa-tshirt"></i>' },
    'health': { label: 'Healthcare', icon: '<i class="fas fa-heartbeat"></i>' },
    'personal': { label: 'Personal Care', icon: '<i class="fas fa-shower"></i>' },
    'education': { label: 'Education', icon: '<i class="fas fa-graduation-cap"></i>' },
    'taxes': { label: 'Taxes', icon: '<i class="fas fa-receipt"></i>' },
    'insurance': { label: 'Insurance', icon: '<i class="fas fa-shield-alt"></i>' },
    'fuel': { label: 'Fuel', icon: '<i class="fas fa-gas-pump"></i>' },
    'parking': { label: 'Parking', icon: '<i class="fas fa-parking"></i>' },
    'cab': { label: 'Cab', icon: '<i class="fas fa-taxi"></i>' },
    'flight': { label: 'Flight', icon: '<i class="fas fa-plane"></i>' },
    'bicycle': { label: 'Bicycle', icon: '<i class="fas fa-bicycle"></i>' },
    'bus': { label: 'Bus', icon: '<i class="fas fa-bus"></i>' },
    'metro': { label: 'Metro', icon: '<i class="fas fa-subway"></i>' },
    'train': { label: 'Train', icon: '<i class="fas fa-train"></i>' },
    'electricity': { label: 'Electricity', icon: '<i class="fas fa-bolt"></i>' },
    'water': { label: 'Water', icon: '<i class="fas fa-tint"></i>' },
    'cleaning': { label: 'Cleaning', icon: '<i class="fas fa-broom"></i>' },
    'gas': { label: 'Gas', icon: '<i class="fas fa-burn"></i>' },
    'internet': { label: 'Internet & Cable', icon: '<i class="fas fa-wifi"></i>' },
    'phone': { label: 'Phone', icon: '<i class="fas fa-phone"></i>' },
    'uncategorized': { label: 'Uncategorized', icon: '<i class="fas fa-question-circle"></i>' }
  };
  
  // If category exists in map, return it; otherwise capitalize first letter
  if (categoryMap[categoryValue]) {
    return categoryMap[categoryValue];
  }
  
  // Fallback: capitalize first letter
  const capitalized = categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1);
  return { label: capitalized, icon: '<i class="fas fa-circle"></i>' };
}

// Draw pie chart - Category breakdown
async function drawPieChart() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    let expenses = await res.json();

    // Apply date filter
    expenses = filterExpensesByDate(expenses);

    if (expenses.length === 0) {
      // Show empty state
      const ctx = document.getElementById("pieChart");
      if (ctx) {
        if (pieChartInstance) pieChartInstance.destroy();
        pieChartInstance = null;
      }
      return;
    }

    // Aggregate expenses by category
    const categoryMap = {};
    expenses.forEach(e => {
      const cat = e.category || 'uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(e.amount || 0);
    });

    const categoryKeys = Object.keys(categoryMap);
    const data = Object.values(categoryMap);
    
    // Format labels - just use the proper names without icons since Chart.js doesn't support HTML
    const labels = categoryKeys.map(key => {
      const display = getCategoryDisplay(key);
      return display.label;
    });
    
    // Generate colors dynamically
    const colors = [
      "#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444",
      "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#3B82F6",
      "#6366F1", "#A855F7", "#84CC16", "#22D3EE", "#FB923C"
    ];

    const ctx = document.getElementById("pieChart");
    if (!ctx) return;

    // Destroy previous chart instance
    if (pieChartInstance) {
      pieChartInstance.destroy();
    }

    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#E5E7EB' : '#111827';

    pieChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: isDarkMode ? '#374151' : '#ffffff'
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Expenses by Category',
            font: { size: 16, weight: 'bold' },
            color: textColor
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${percentage}%)`;
              }
            }
          },
          legend: {
            display: false  // Hide default legend, we'll create custom HTML legend
          }
        },
      },
    });

    // Create custom HTML legend with Font Awesome icons
    const legendContainer = document.getElementById('pieLegend');
    if (legendContainer) {
      const total = data.reduce((a, b) => a + b, 0);
      legendContainer.innerHTML = categoryKeys.map((key, index) => {
        const display = getCategoryDisplay(key);
        const value = data[index];
        const percentage = ((value / total) * 100).toFixed(1);
        const color = colors[index % colors.length];
        
        return `
          <div class="legend-item flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors" data-index="${index}">
            <div style="width: 16px; height: 16px; background-color: ${color}; border-radius: 3px; flex-shrink: 0;"></div>
            <span class="text-gray-700 dark:text-gray-300 text-sm">${display.icon} ${display.label}</span>
            <span class="ml-auto text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">${percentage}%</span>
          </div>
        `;
      }).join('');

      // Add click handlers to legend items to toggle visibility
      legendContainer.querySelectorAll('.legend-item').forEach((item, index) => {
        item.addEventListener('click', () => {
          const meta = pieChartInstance.getDatasetMeta(0);
          const segment = meta.data[index];
          
          // Toggle visibility
          segment.hidden = !segment.hidden;
          
          // Update legend item opacity
          if (segment.hidden) {
            item.style.opacity = '0.3';
            item.style.textDecoration = 'line-through';
          } else {
            item.style.opacity = '1';
            item.style.textDecoration = 'none';
          }
          
          // Update the chart
          pieChartInstance.update();
        });
      });
    }
  } catch (err) {
    console.error('Error drawing pie chart:', err);
  }
}

// Initialize and update charts
async function updateCharts() {
  await drawLineChart();
  await drawPieChart();
}

// Train ML model with existing expenses
async function trainModel() {
  try {
    console.log('🤖 Starting model training...');
    const response = await fetch('http://localhost:5000/api/train-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Training failed');
    }
    
    const result = await response.json();
    isModelTrained = true;
    console.log(`✅ Model trained! Accuracy: ${(result.accuracy * 100).toFixed(1)}%, Samples: ${result.samples}`);
    return true;
  } catch (err) {
    console.log('⚠️ Model training skipped:', err.message);
    return false;
  }
}

// Predict category based on title and amount
async function predictCategory(title, amount) {
  if (!isModelTrained) {
    console.log('⚠️ Model not trained yet');
    return null;
  }
  
  if (!title) return null;
  
  try {
    console.log('🔮 Predicting category for:', title, amount);
    const response = await fetch(`${ML_API}/predict-category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount: parseFloat(amount) || 0 })
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    console.log('📊 Prediction result:', result);
    
    // Only use prediction if confidence is high enough
    if (result.confidence >= 0.6) {
      return result.category;
    }
  } catch (err) {
    console.error('❌ Prediction error:', err);
  }
  
  return null;
}

// Setup auto-prediction on title input
function setupAutoPrediction() {
  const titleInput = document.getElementById('title');
  const amountInput = document.getElementById('amount');
  const categoryInput = document.getElementById('category');
  const categorySelect = document.getElementById('categorySelect');
  
  if (!titleInput || !categoryInput || !categorySelect) return;
  
  let debounceTimer;
  let lastPredictedCategory = null;
  
  const handlePrediction = async () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const title = titleInput.value.trim();
      const amount = amountInput.value;
      
      if (title.length < 3) {
        // Reset category if title is too short
        if (lastPredictedCategory) {
          categoryInput.value = '';
          categorySelect.innerHTML = `<span><i class="fas fa-tags mr-2"></i>Category</span>`;
          lastPredictedCategory = null;
        }
        return;
      }
      
      const predicted = await predictCategory(title, amount);
      
      if (predicted) {
        // Update the category dropdown
        categoryInput.value = predicted;
        lastPredictedCategory = predicted;
        const categoryOption = document.querySelector(`[data-value="${predicted}"]`);
        if (categoryOption) {
          const icon = categoryOption.querySelector('i') ? categoryOption.querySelector('i').outerHTML + ' ' : '';
          const label = categoryOption.textContent.trim();
          categorySelect.innerHTML = `${icon}${label} <span class="text-xs text-indigo-400 ml-1">✨</span>`;
        }
      } else if (lastPredictedCategory) {
        // Clear previous prediction if no new prediction
        categoryInput.value = '';
        categorySelect.innerHTML = `<span><i class="fas fa-tags mr-2"></i>Category</span>`;
        lastPredictedCategory = null;
      }
    }, 500); // Wait 500ms after user stops typing
  };
  
  titleInput.addEventListener('input', handlePrediction);
  amountInput.addEventListener('input', handlePrediction);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 App loaded - ML features enabled');
  initializeCustomSelect();
  initializeChartFilters();
  initializeChartOptions();
  initializeDateFilters();
  initializeDatePickers(); // Initialize flatpickr date pickers first
  loadExpenses();
  updateCharts(); // This will call updateExpenseDates which will refresh the calendars
  
  // Auto-train model and setup prediction
  trainModel().then(() => {
    console.log('Training completed. Model trained:', isModelTrained);
    if (isModelTrained) {
      setupAutoPrediction();
      console.log('✅ Auto-prediction is now active!');
    }
  });
});
