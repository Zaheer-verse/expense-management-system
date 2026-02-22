const STORAGE_KEYS = {
  expenses: "se_expenses",
  goals: "se_goals",
  budget: "se_budget",
  theme: "se_theme"
};

const categoryColors = {
  Food: "#f39c3f",
  Transport: "#2ebfa5",
  Fees: "#4b7bec",
  Books: "#9b59b6",
  Other: "#7f8c8d"
};

function getExpenses() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses) || "[]");
}

function setExpenses(items) {
  localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(items));
}

function getGoals() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.goals) || "[]");
}

function setGoals(items) {
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(items));
}

function getBudget() {
  return Number(localStorage.getItem(STORAGE_KEYS.budget) || 1200);
}

function setBudget(value) {
  localStorage.setItem(STORAGE_KEYS.budget, String(value));
}

function money(n) {
  return `PKR ${Number(n).toFixed(2)}`;
}

function currentMonthExpenses() {
  const now = new Date();
  return getExpenses().filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

function initTheme() {
  const html = document.documentElement;
  const saved = localStorage.getItem(STORAGE_KEYS.theme) || "light";
  html.setAttribute("data-theme", saved);

  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
    renderForPage();
  });
}

function createExpenseListItem(expense, index, includeDelete = true) {
  const li = document.createElement("li");
  li.innerHTML = `
    <div>
      <strong>${expense.title}</strong>
      <div class="meta">${expense.category} - ${expense.date}</div>
    </div>
    <div>
      <strong>${money(expense.amount)}</strong>
      ${includeDelete ? `<button class="btn small danger" data-remove-expense="${index}">Delete</button>` : ""}
    </div>
  `;
  return li;
}

function renderDashboard() {
  const monthItems = currentMonthExpenses();
  const total = monthItems.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = getBudget();

  const monthSpend = document.getElementById("monthSpend");
  const monthBudget = document.getElementById("monthBudget");
  const monthRemaining = document.getElementById("monthRemaining");
  const expenseCount = document.getElementById("expenseCount");

  if (monthSpend) monthSpend.textContent = money(total);
  if (monthBudget) monthBudget.textContent = money(budget);
  if (monthRemaining) monthRemaining.textContent = money(budget - total);
  if (expenseCount) expenseCount.textContent = String(monthItems.length);

  const recentList = document.getElementById("recentList");
  if (recentList) {
    recentList.innerHTML = "";
    monthItems
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6)
      .forEach((item) => recentList.appendChild(createExpenseListItem(item, -1, false)));

    if (!monthItems.length) {
      const li = document.createElement("li");
      li.textContent = "No expenses in this month yet.";
      recentList.appendChild(li);
    }
  }

  drawCategoryChart("categoryChart", monthItems);
}

function renderAddExpense() {
  const form = document.getElementById("expenseForm");
  const list = document.getElementById("expenseList");
  const clearBtn = document.getElementById("clearExpenses");

  if (!form || !list) return;

  const dateInput = form.querySelector('input[name="date"]');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  function paint() {
    const items = getExpenses().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    list.innerHTML = "";

    items.forEach((expense, idx) => list.appendChild(createExpenseListItem(expense, idx, true)));

    if (!items.length) {
      const li = document.createElement("li");
      li.textContent = "No expenses added yet.";
      list.appendChild(li);
    }

    list.querySelectorAll("[data-remove-expense]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sorted = getExpenses().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        const item = sorted[Number(btn.dataset.removeExpense)];
        if (!item) return;

        const original = getExpenses();
        const removeIndex = original.findIndex(
          (o) => o.title === item.title && o.amount === item.amount && o.date === item.date && o.category === item.category
        );
        if (removeIndex >= 0) {
          original.splice(removeIndex, 1);
          setExpenses(original);
          paint();
        }
      });
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      title: String(fd.get("title") || "").trim(),
      amount: Number(fd.get("amount") || 0),
      category: String(fd.get("category") || "Other"),
      date: String(fd.get("date") || new Date().toISOString().slice(0, 10))
    };

    if (!payload.title || payload.amount <= 0) return;

    const items = getExpenses();
    items.push(payload);
    setExpenses(items);
    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    paint();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.expenses);
      paint();
    });
  }

  paint();
}

function drawCategoryChart(canvasId, expenses) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 500;
  const cssHeight = canvas.height;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);

  const totals = {};
  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
  });

  const entries = Object.entries(totals);
  const totalAmount = entries.reduce((s, [, v]) => s + v, 0);
  const centerX = cssWidth / 2;
  const centerY = cssHeight / 2;
  const radius = Math.min(cssWidth, cssHeight) * 0.32;

  ctx.clearRect(0, 0, cssWidth, cssHeight);

  if (!entries.length || totalAmount <= 0) {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted");
    ctx.font = "14px Poppins";
    ctx.fillText("No data to display", centerX - 55, centerY);
    return;
  }

  let start = -Math.PI / 2;
  entries.forEach(([cat, amount]) => {
    const angle = (amount / totalAmount) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = categoryColors[cat] || "#999";
    ctx.fill();
    start += angle;
  });

  let ly = 16;
  entries.forEach(([cat, amount]) => {
    ctx.fillStyle = categoryColors[cat] || "#999";
    ctx.fillRect(12, ly - 9, 11, 11);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text");
    ctx.font = "12px Poppins";
    ctx.fillText(`${cat}: ${money(amount)}`, 28, ly);
    ly += 18;
  });
}

function drawLineChart(canvasId, expenses) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 500;
  const cssHeight = canvas.height;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();

  const daily = Array.from({ length: days }, () => 0);
  expenses.forEach((e) => {
    const d = new Date(e.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      daily[d.getDate() - 1] += Number(e.amount);
    }
  });

  const max = Math.max(...daily, 1);
  const pad = 26;

  ctx.strokeStyle = "rgba(127, 140, 157, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, cssHeight - pad);
  ctx.lineTo(cssWidth - pad, cssHeight - pad);
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, cssHeight - pad);
  ctx.stroke();

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--primary");
  ctx.lineWidth = 2.4;
  ctx.beginPath();

  daily.forEach((value, i) => {
    const x = pad + (i / (days - 1 || 1)) * (cssWidth - pad * 2);
    const y = cssHeight - pad - (value / max) * (cssHeight - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text");
  ctx.font = "12px Poppins";
  ctx.fillText("Day 1", pad - 8, cssHeight - 10);
  ctx.fillText(`Day ${days}`, cssWidth - pad - 28, cssHeight - 10);
  ctx.fillText(money(max), 6, pad - 8);
}

function renderAnalytics() {
  const expenses = getExpenses();
  const monthItems = currentMonthExpenses();
  const totals = {};
  monthItems.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
  });

  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const totalMonth = monthItems.reduce((s, e) => s + Number(e.amount), 0);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const maxSingle = monthItems.reduce((m, e) => Math.max(m, Number(e.amount)), 0);
  const activeDays = new Set(monthItems.map((e) => e.date)).size;

  const topCategory = document.getElementById("topCategory");
  const avgDaily = document.getElementById("avgDaily");
  const highestExpense = document.getElementById("highestExpense");
  const activeDaysEl = document.getElementById("activeDays");

  if (topCategory) topCategory.textContent = top ? top[0] : "-";
  if (avgDaily) avgDaily.textContent = money(totalMonth / daysInMonth);
  if (highestExpense) highestExpense.textContent = money(maxSingle);
  if (activeDaysEl) activeDaysEl.textContent = String(activeDays);

  drawLineChart("dailyChart", expenses);
  drawCategoryChart("categoryChartDetailed", monthItems);
}

function renderGoals() {
  const form = document.getElementById("goalForm");
  const list = document.getElementById("goalsList");
  const clearBtn = document.getElementById("clearGoals");

  if (!form || !list) return;

  function paint() {
    const goals = getGoals();
    list.innerHTML = "";

    goals.forEach((g, index) => {
      const wrap = document.createElement("div");
      wrap.className = "goal";
      const progress = Math.min(100, (g.saved / g.target) * 100);

      wrap.innerHTML = `
        <div class="card-head">
          <strong>${g.name}</strong>
          <button class="btn small danger" data-remove-goal="${index}">Delete</button>
        </div>
        <div class="meta">${money(g.saved)} / ${money(g.target)}</div>
        <div class="progress"><span style="width:${progress}%"></span></div>
      `;
      list.appendChild(wrap);
    });

    if (!goals.length) {
      const empty = document.createElement("p");
      empty.className = "helper";
      empty.textContent = "No goals yet. Add your first savings goal.";
      list.appendChild(empty);
    }

    list.querySelectorAll("[data-remove-goal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const goals = getGoals();
        goals.splice(Number(btn.dataset.removeGoal), 1);
        setGoals(goals);
        paint();
      });
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      target: Number(fd.get("target") || 0),
      saved: Number(fd.get("saved") || 0)
    };

    if (!payload.name || payload.target <= 0 || payload.saved < 0) return;

    const goals = getGoals();
    goals.push(payload);
    setGoals(goals);
    form.reset();
    paint();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.goals);
      paint();
    });
  }

  paint();
}

function renderSettings() {
  const budgetForm = document.getElementById("budgetForm");
  const budgetNote = document.getElementById("budgetNote");

  if (!budgetForm || !budgetNote) return;

  const budgetInput = budgetForm.querySelector('input[name="budget"]');
  if (budgetInput) budgetInput.value = String(getBudget());

  function paint() {
    budgetNote.textContent = `Current budget: ${money(getBudget())}`;
  }

  budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(budgetForm);
    const value = Number(fd.get("budget") || 0);
    if (value > 0) {
      setBudget(value);
      paint();
    }
  });

  paint();
}

function renderForPage() {
  const path = location.pathname.split("/").pop();
  if (!path || path === "index.html") renderDashboard();
  if (path === "add-expense.html") renderAddExpense();
  if (path === "analytics.html") renderAnalytics();
  if (path === "goals.html") renderGoals();
  if (path === "settings.html") renderSettings();
}

window.addEventListener("resize", () => {
  renderForPage();
});

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderForPage();
});
