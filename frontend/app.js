const API_BASE = 'http://localhost:5000/api/expenses';
let editingId = null;

// Initialize custom select functionality
function initializeCustomSelect() {
  const selectedOption = document.querySelector('.selected-option');
  const customSelect = document.querySelector('.custom-select');
  const hiddenInput = document.getElementById('category');

  selectedOption.addEventListener('click', () => {
    customSelect.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('open');
    }
  });

  // Handle option selection
  const options = document.querySelectorAll('.option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      const value = option.getAttribute('data-value');
      const html = option.innerHTML;
      selectedOption.innerHTML = html;
      hiddenInput.value = value;
      customSelect.classList.remove('open');
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
    if (!response.ok) {
      const text = await response.text().catch(()=>null);
      setStatus('Add failed: ' + (text || response.statusText));
      return;
    }
    setStatus('Expense added.');
    document.getElementById('expenseForm').reset();
    await loadExpenses();
  } catch (error) {
    setStatus('Error: ' + error.message);
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
      if (editingId === e.id) {
        // Edit mode
        li.innerHTML = '';
        li.appendChild(makeInput('text', e.title, 'Title', 'edit-title'));
        li.appendChild(makeInput('number', e.amount, 'Amount', 'edit-amount'));
        li.appendChild(makeInput('text', e.category, 'Category', 'edit-category'));
        li.appendChild(makeInput('date', e.createdAt ? e.createdAt.split('T')[0] : '', 'Date', 'edit-date'));
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'edit';
        saveBtn.onclick = async () => {
          await updateExpense(e.id);
        };
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => { editingId = null; loadExpenses(); };
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);
      } else {
        const categoryText = getCategoryDisplay(e.category);
      li.innerHTML = `<span><strong>${e.title}</strong> — ${e.amount} (${categoryText}) <span style='color:#888;font-size:0.9em'>${e.createdAt ? e.createdAt.split('T')[0] : ''}</span></span>`;
        const actions = document.createElement('span');
        actions.className = 'expense-actions';
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'edit';
        editBtn.onclick = () => { editingId = e.id; loadExpenses(); };
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = async () => {
          if (!confirm('Delete this expense?')) return;
          try {
            const d = await fetch(`${API_BASE}/${e.id}`, { method: 'DELETE' });
            if (!d.ok) {
              const txt = await d.text().catch(()=>null);
              setStatus('Delete failed: ' + (txt || d.statusText));
              return;
            }
            setStatus('Deleted.');
            await loadExpenses();
          } catch (delErr) {
            setStatus('Delete failed: ' + delErr.message);
          }
        };
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        li.appendChild(actions);
      }
      list.appendChild(li);
    });
  } catch (err) {
    setStatus('Failed to load expenses: ' + err.message);
  }
}

function makeInput(type, value, placeholder, id) {
  const input = document.createElement('input');
  input.type = type;
  input.value = value || '';
  input.placeholder = placeholder;
  input.id = id;
  input.style.marginRight = '6px';
  return input;
}

async function updateExpense(id) {
  try {
    setStatus('');
    const title = document.getElementById('edit-title').value.trim();
    const amount = document.getElementById('edit-amount').value;
    const category = document.getElementById('edit-category').value.trim();
    const date = document.getElementById('edit-date').value;
    if (!title || !amount || !category) {
      setStatus('Please fill in all fields.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setStatus('Please enter a valid amount.');
      return;
    }
    const resp = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        title,
        amount: parseFloat(amount),
        category,
        date
      })
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(()=>null);
      setStatus('Update failed: ' + (txt || resp.statusText));
      return;
    }
    setStatus('Expense updated.');
    editingId = null;
    await loadExpenses();
  } catch (err) {
    setStatus('Update failed: ' + err.message);
  }
}

function setStatus(msg) {
  const s = document.getElementById('status');
  if (!s) return;
  s.textContent = msg || '';
}

// Helper function to get readable category name
function getCategoryDisplay(value) {
  // Handle old data format
  if (!value || !value.includes(':')) return value;
  
  const [mainCategory, subCategory] = value.split(':');
  
  // Capitalize main category
  const mainFormatted = mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1);
  
  const select = document.getElementById('category');
  if (!select) return `${mainFormatted} - ${subCategory}`;
  
  // Find the option to get its display text
  for (const option of select.getElementsByTagName('option')) {
    if (option.value === value) {
      return `${mainFormatted} - ${option.textContent}`;
    }
  }
  
  // Fallback for uncategorized or unknown values
  if (value === 'uncategorized') return 'Uncategorized';
  return value;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeCustomSelect();
  loadExpenses();
});
