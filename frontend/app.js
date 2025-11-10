const API_BASE = 'http://localhost:5000/api/expenses';
let editingId = null;

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

document.addEventListener('DOMContentLoaded', () => {
  initializeCustomSelect();
  loadExpenses();
});

// Set user-defined options
let limit = 1000; // default limit
let fromDate = "2025-10-01";
let toDate = "2025-10-21";
let groupBy = "daily"; // options: daily, weekly, monthly

// Fetch data from backend
async function fetchExpenses() {
  const res = await fetch(`http://localhost:5000/api/expenses?from=${fromDate}&to=${toDate}&groupBy=${groupBy}`);
  const data = await res.json();
  return data;
}

// Draw line chart
function drawLineChart(expenses) {
  const ctx = document.getElementById("lineChart").getContext("2d");

  const labels = expenses.map(e => e.date);
  const amounts = expenses.map(e => e.amount);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Daily Expense",
          data: amounts,
          borderColor: "#4FD1C5",
          backgroundColor: "rgba(79, 209, 197, 0.2)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Limit",
          data: Array(amounts.length).fill(limit),
          borderColor: "red",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      interaction: {
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Draw pie chart
function drawPieChart(expenses) {
  const ctx = document.getElementById("pieChart").getContext("2d");

  // Aggregate expenses by category
  const categoryMap = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);
  const colors = ["#4FD1C5", "#F6AD55", "#ED64A6", "#63B3ED", "#F56565"];

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// Initialize charts
async function initCharts() {
  const expenses = await fetchExpenses();
  drawLineChart(expenses);
  drawPieChart(expenses);
}

// Run on page load
initCharts();
