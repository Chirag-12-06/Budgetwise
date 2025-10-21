const API_BASE = 'http://localhost:5000/api/expenses';
let editingId = null;

function initializeCustomSelect() {
  const categorySelect = document.getElementById('categorySelect');
  const categoryMenu = document.getElementById('categoryMenu');
  const categoryInput = document.getElementById('category');

  // Toggle dropdown visibility
  categorySelect.addEventListener('click', () => {
    categoryMenu.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!categorySelect.contains(e.target) && !categoryMenu.contains(e.target)) {
      categoryMenu.classList.add('hidden');
    }
  });

  // Select option
  document.querySelectorAll('.category-option').forEach(option => {
    option.addEventListener('click', () => {
      const value = option.dataset.value;
      const label = option.textContent.trim();
      categorySelect.innerHTML = `<i class="fas fa-tags mr-2"></i> ${label}`;
      categoryInput.value = value;
      categoryMenu.classList.add('hidden');
    });
  });
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
    document.getElementById('categorySelect').innerHTML = `<i class="fas fa-tags mr-2"></i>Select`;
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
      li.className = 'flex justify-between items-center bg-gray-700 px-4 py-2 rounded-md';
      li.innerHTML = `
        <div>
          <span class="font-semibold text-indigo-300">${e.title}</span> — ₹${e.amount}
          <span class="text-gray-400 text-sm">(${e.category})</span>
          <span class="text-gray-500 text-xs">${e.createdAt ? e.createdAt.split('T')[0] : ''}</span>
        </div>
        <div class="space-x-2">
          <button class="text-yellow-400 hover:underline" onclick="editExpense(${e.id})">Edit</button>
          <button class="text-red-400 hover:underline" onclick="deleteExpense(${e.id})">Delete</button>
        </div>`;
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
