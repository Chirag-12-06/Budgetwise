const API_BASE = 'http://localhost:5000/api/expenses';
let editingId = null;
let currentFilter = 'daily'; // Track current chart filter
let excludeOutliers = false;
let useLogScale = false;

// Detect outliers using IQR (Interquartile Range) method
function detectOutliers(data) {
  if (data.length === 0) return { outliers: [], threshold: null };
  
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers = data.filter(val => val < lowerBound || val > upperBound);
  
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

// Draw line chart with aggregation
async function drawLineChart() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const expenses = await res.json();

    if (expenses.length === 0) {
      const ctx = document.getElementById("lineChart");
      if (ctx) {
        if (lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = null;
      }
      return;
    }

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

    lineChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)} Spending (₹)`,
            data: amounts,
            borderColor: "#4F46E5",
            backgroundColor: "rgba(79, 70, 229, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: chartTitle,
            font: { size: 16, weight: 'bold' },
            color: getComputedStyle(document.documentElement).getPropertyValue('color') || '#111827'
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
            display: true,
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('color') || '#111827'
            }
          }
        },
        interaction: {
          intersect: false,
        },
        scales: {
          y: {
            type: useLogScale ? 'logarithmic' : 'linear',
            beginAtZero: !useLogScale,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              },
              color: '#6B7280'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              color: '#6B7280',
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

// Draw pie chart - Category breakdown
async function drawPieChart() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const expenses = await res.json();

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

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);
    
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

    pieChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#ffffff'
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'Expenses by Category',
            font: { size: 16, weight: 'bold' },
            color: getComputedStyle(document.documentElement).getPropertyValue('color') || '#111827'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
              }
            }
          },
          legend: {
            position: "right",
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('color') || '#111827',
              padding: 15,
              font: { size: 12 }
            }
          }
        },
      },
    });
  } catch (err) {
    console.error('Error drawing pie chart:', err);
  }
}

// Initialize and update charts
async function updateCharts() {
  await drawLineChart();
  await drawPieChart();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeCustomSelect();
  initializeChartFilters();
  initializeChartOptions();
  loadExpenses();
  updateCharts();
});
