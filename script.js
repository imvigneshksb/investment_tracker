// Enhanced Investment Tracker with NSE/BSE API Integration
// Storage utility functions for userData.json management
let userData = { users: {}, sessions: {}, appSettings: {} };
let portfolioData = { stocks: [], mutualFunds: [] };
let isRefreshing = false;
let currentEditItem = null;
let currentDeleteItem = null;

// Load userData from JSON file via server API
async function loadUserData() {
  try {
    // First try to load from server API
    const response = await fetch("/api/load-user-data");
    if (response.ok) {
      userData = await response.json();
      console.log("User data loaded from server API");

      // Also save to localStorage as backup
      localStorage.setItem("userData_backup", JSON.stringify(userData));
      return;
    }
  } catch (error) {
    console.log("Server API not available, trying localStorage backup");
  }

  try {
    // Fallback to localStorage backup if server is not available
    const backupData = localStorage.getItem("userData_backup");
    if (backupData) {
      userData = JSON.parse(backupData);
      console.log("User data loaded from localStorage backup");
      return;
    }
  } catch (error) {
    console.log("Error loading from localStorage:", error);
  }

  // Final fallback to default structure
  console.log("Using default userData structure");
}

// Save userData to JSON file via server API
async function saveUserData() {
  try {
    // Save to localStorage as immediate backup
    localStorage.setItem("userData_backup", JSON.stringify(userData));

    // Try to save to server API for persistent file storage
    const response = await fetch("/api/save-user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ User data saved to userData.json file via server API");
    } else {
      console.log(
        "⚠️ Server API not available, data saved to localStorage only"
      );
    }
  } catch (error) {
    console.log("⚠️ Server API error, data saved to localStorage only:", error);
  }
}

// Get user data by email
function getUserData(email) {
  return userData.users[email] || null;
}

// Set user data by email
async function setUserData(email, userInfo) {
  userData.users[email] = userInfo;
  await saveUserData();
}

// Session management
function getCurrentSession() {
  return userData.sessions.currentUser || null;
}

async function setCurrentSession(sessionData) {
  userData.sessions.currentUser = sessionData;
  userData.sessions.isLoggedIn = true;
  userData.sessions.currentPage = sessionData.currentPage || "dashboard";
  await saveUserData();
}

async function clearCurrentSession() {
  userData.sessions = {};
  await saveUserData();
}

// Error message helper functions
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 5000);
  }
}

function hideError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.style.display = "none";
  }
}

// Notification system
function showNotification(message, type = "info", duration = 3000) {
  const container = document.getElementById("notificationContainer");
  if (!container) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(notification);

  // Auto-remove after duration
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, duration);
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatNumber(num, decimals = 2) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num || 0);
}

function formatPercentage(num) {
  return `${formatNumber(num, 2)}%`;
}

// Login functionality
async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  hideError("loginError");

  if (!email) {
    showError("loginError", "Please enter your email address");
    return;
  }

  if (!password) {
    showError("loginError", "Please enter your password");
    return;
  }

  await loadUserData();
  const user = getUserData(email);

  if (!user) {
    showError("loginError", "No account found with this email address");
    return;
  }

  if (user.password !== password) {
    showError("loginError", "Incorrect password");
    return;
  }

  // Login successful
  await setCurrentSession({
    email: email,
    firstName: user.firstName,
    lastName: user.lastName,
    currentPage: "dashboard",
  });

  showPage("dashboard");
  showNotification(`Welcome back, ${user.firstName}!`, "success");

  // Load portfolio data
  await loadPortfolio();
}

// Signup functionality
async function handleSignup() {
  const firstName = document.getElementById("signupFirstName").value.trim();
  const lastName = document.getElementById("signupLastName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById(
    "signupConfirmPassword"
  ).value;

  hideError("signupError");

  if (!firstName) {
    showError("signupError", "Please enter your first name");
    return;
  }

  if (!lastName) {
    showError("signupError", "Please enter your last name");
    return;
  }

  if (!email) {
    showError("signupError", "Please enter your email address");
    return;
  }

  if (!password) {
    showError("signupError", "Please enter a password");
    return;
  }

  if (password !== confirmPassword) {
    showError("signupError", "Passwords do not match");
    return;
  }

  if (password.length < 6) {
    showError("signupError", "Password must be at least 6 characters long");
    return;
  }

  await loadUserData();
  const existingUser = getUserData(email);

  if (existingUser) {
    showError("signupError", "An account with this email already exists");
    return;
  }

  // Create new user
  const newUser = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    createdAt: new Date().toISOString(),
    portfolio: { stocks: [], mutualFunds: [] },
  };

  await setUserData(email, newUser);

  // Auto-login after signup
  await setCurrentSession({
    email: email,
    firstName: firstName,
    lastName: lastName,
    currentPage: "dashboard",
  });

  showPage("dashboard");
  showNotification(`Welcome to Investment Tracker, ${firstName}!`, "success");

  // Load empty portfolio
  await loadPortfolio();
}

// Page navigation
function showPage(pageName) {
  const pages = {
    login: document.getElementById("loginSection"),
    signup: document.getElementById("signupSection"),
    dashboard: document.getElementById("dashboardContent"),
    profile: document.getElementById("profileSettingsSection"),
  };

  // Hide all pages
  Object.values(pages).forEach((page) => {
    if (page) page.style.display = "none";
  });

  // Show selected page
  if (pages[pageName]) {
    pages[pageName].style.display = "block";
  }

  // Update session
  if (userData.sessions.currentUser) {
    userData.sessions.currentUser.currentPage = pageName;
    saveUserData();
  }
}

function goToSignup() {
  showPage("signup");
}

function goToLogin() {
  showPage("login");
}

function goToHomePage() {
  const session = getCurrentSession();
  if (session) {
    showPage("dashboard");
  } else {
    showPage("login");
  }
}

// Profile menu functionality
function toggleProfileMenu() {
  const menu = document.querySelector(".profile-dropdown");
  if (menu) {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }
}

async function logout() {
  await clearCurrentSession();
  showPage("login");
  showNotification("You have been logged out", "info");

  // Clear portfolio data
  portfolioData = { stocks: [], mutualFunds: [] };
  updatePortfolioDisplay();
}

// Portfolio Management Functions

// Load portfolio data
async function loadPortfolio() {
  try {
    const response = await fetch("/api/portfolio");
    if (response.ok) {
      portfolioData = await response.json();
      updatePortfolioDisplay();
    } else {
      throw new Error("Failed to load portfolio");
    }
  } catch (error) {
    console.error("Error loading portfolio:", error);
    showNotification("Failed to load portfolio data", "error");
  }
}

// Update portfolio display
function updatePortfolioDisplay() {
  updateSummaryCards();
  updateStocksTable();
  updateMutualFundsTable();
}

// Update summary cards
function updateSummaryCards() {
  const { stocks, mutualFunds } = portfolioData;

  let totalInvestment = 0;
  let currentValue = 0;

  // Calculate totals for stocks
  stocks.forEach((stock) => {
    totalInvestment += stock.investedAmount || 0;
    currentValue += stock.totalValue || 0;
  });

  // Calculate totals for mutual funds
  mutualFunds.forEach((mf) => {
    totalInvestment += mf.investedAmount || 0;
    currentValue += mf.totalValue || 0;
  });

  const totalGainLoss = currentValue - totalInvestment;
  const returnPercentage =
    totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

  // Update DOM elements
  const totalInvestmentEl = document.getElementById("totalInvestment");
  const currentValueEl = document.getElementById("currentValue");
  const totalGainLossEl = document.getElementById("totalGainLoss");
  const returnPercentageEl = document.getElementById("returnPercentage");

  if (totalInvestmentEl)
    totalInvestmentEl.textContent = formatCurrency(totalInvestment);
  if (currentValueEl) currentValueEl.textContent = formatCurrency(currentValue);

  if (totalGainLossEl) {
    totalGainLossEl.textContent = formatCurrency(totalGainLoss);
    totalGainLossEl.className = `value ${
      totalGainLoss >= 0 ? "positive" : "negative"
    }`;
  }

  if (returnPercentageEl) {
    returnPercentageEl.textContent = formatPercentage(returnPercentage);
    returnPercentageEl.className = `value ${
      returnPercentage >= 0 ? "positive" : "negative"
    }`;
  }
}

// Update stocks table
function updateStocksTable() {
  const tableBody = document.getElementById("stocksTableBody");
  if (!tableBody) return;

  const { stocks } = portfolioData;

  if (stocks.length === 0) {
    tableBody.innerHTML = `
      <div class="no-holdings">
        <p>No stocks in portfolio.</p>
      </div>
    `;
    return;
  }

  tableBody.innerHTML = stocks
    .map(
      (stock) => `
    <div class="holding-row">
      <div class="holding-col">
        <div class="symbol-info">
          <span class="symbol">${stock.originalSymbol || stock.symbol}</span>
          <span class="exchange">${stock.exchange || "NSE"}</span>
        </div>
      </div>
      <div class="holding-col">
        <span class="company-name" title="${stock.companyName || stock.symbol}">
          ${stock.companyName || stock.symbol}
        </span>
      </div>
      <div class="holding-col">${formatNumber(stock.quantity, 0)}</div>
      <div class="holding-col">${formatCurrency(stock.purchasePrice)}</div>
      <div class="holding-col">
        <div>
          ${formatCurrency(stock.currentPrice)}
          ${
            stock.changePercent
              ? `<small class="${
                  stock.changePercent >= 0 ? "positive" : "negative"
                }">(${formatPercentage(stock.changePercent)})</small>`
              : ""
          }
        </div>
      </div>
      <div class="holding-col">${formatCurrency(stock.investedAmount)}</div>
      <div class="holding-col">${formatCurrency(stock.totalValue)}</div>
      <div class="holding-col">
        <span class="${stock.totalGain >= 0 ? "positive" : "negative"}">
          ${formatCurrency(stock.totalGain)}
        </span>
      </div>
      <div class="holding-col">
        <span class="${stock.gainPercent >= 0 ? "positive" : "negative"}">
          ${formatPercentage(stock.gainPercent)}
        </span>
      </div>
      <div class="holding-col">
        <div class="actions">
          <button class="portfolio-action-btn edit-btn" onclick="editStock('${
            stock.id || stock.symbol
          }')" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="portfolio-action-btn delete-btn" onclick="deleteStock('${
            stock.id || stock.symbol
          }')" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

// Update mutual funds table
function updateMutualFundsTable() {
  const tableBody = document.getElementById("mutualFundsTableBody");
  if (!tableBody) return;

  const { mutualFunds } = portfolioData;

  if (mutualFunds.length === 0) {
    tableBody.innerHTML = `
      <div class="no-holdings">
        <p>No mutual funds in portfolio.</p>
      </div>
    `;
    return;
  }

  tableBody.innerHTML = mutualFunds
    .map(
      (mf) => `
    <div class="holding-row">
      <div class="holding-col">
        <span class="symbol">${mf.scheme}</span>
      </div>
      <div class="holding-col">
        <span class="company-name" title="${mf.schemeName || mf.scheme}">
          ${mf.schemeName || mf.scheme}
        </span>
      </div>
      <div class="holding-col">${formatNumber(mf.units, 3)}</div>
      <div class="holding-col">${formatCurrency(mf.purchaseNAV)}</div>
      <div class="holding-col">
        <div>
          ${formatCurrency(mf.currentNAV)}
          ${
            mf.changePercent
              ? `<small class="${
                  mf.changePercent >= 0 ? "positive" : "negative"
                }">(${formatPercentage(mf.changePercent)})</small>`
              : ""
          }
        </div>
      </div>
      <div class="holding-col">${formatCurrency(mf.investedAmount)}</div>
      <div class="holding-col">${formatCurrency(mf.totalValue)}</div>
      <div class="holding-col">
        <span class="${mf.totalGain >= 0 ? "positive" : "negative"}">
          ${formatCurrency(mf.totalGain)}
        </span>
      </div>
      <div class="holding-col">
        <span class="${mf.gainPercent >= 0 ? "positive" : "negative"}">
          ${formatPercentage(mf.gainPercent)}
        </span>
      </div>
      <div class="holding-col">
        <div class="actions">
          <button class="portfolio-action-btn edit-btn" onclick="editMutualFund('${
            mf.id || mf.scheme
          }')" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="portfolio-action-btn delete-btn" onclick="deleteMutualFund('${
            mf.id || mf.scheme
          }')" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

// Refresh portfolio
async function refreshPortfolio() {
  if (isRefreshing) return;

  isRefreshing = true;
  const refreshBtn = document.getElementById("refreshPortfolio");

  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.classList.add("refreshing");
  }

  try {
    const response = await fetch("/api/portfolio/refresh", {
      method: "POST",
    });

    if (response.ok) {
      const result = await response.json();
      showNotification(
        `Portfolio refreshed! Updated ${result.updatedCount} items.`,
        "success"
      );
      await loadPortfolio();
    } else {
      throw new Error("Failed to refresh portfolio");
    }
  } catch (error) {
    console.error("Error refreshing portfolio:", error);
    showNotification("Failed to refresh portfolio", "error");
  } finally {
    isRefreshing = false;

    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove("refreshing");
    }
  }
}

// Modal functions
function showAddInvestmentModal() {
  const modal = document.getElementById("addInvestmentModal");
  if (modal) {
    modal.style.display = "flex";

    // Set default date to today
    const stockDate = document.getElementById("stockDate");
    const mfDate = document.getElementById("mfDate");
    const today = new Date().toISOString().split("T")[0];

    if (stockDate) stockDate.value = today;
    if (mfDate) mfDate.value = today;
  }
}

// Specific modal functions for category buttons
function showAddStockModal() {
  const modal = document.getElementById("addStockModal");
  if (modal) {
    modal.style.display = "flex";
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    const stockDate = document.getElementById("stockDate");
    if (stockDate) stockDate.value = today;
  }
}

function showAddMutualFundModal() {
  const modal = document.getElementById("addMutualFundModal");
  if (modal) {
    modal.style.display = "flex";
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    const mfDate = document.getElementById("mfDate");
    if (mfDate) mfDate.value = today;
  }
}

function hideAddStockModal() {
  const modal = document.getElementById("addStockModal");
  if (modal) {
    modal.style.display = "none";
    // Clear stock form
    clearStockForm();
  }
}

function hideAddMutualFundModal() {
  const modal = document.getElementById("addMutualFundModal");
  if (modal) {
    modal.style.display = "none";
    // Clear mutual fund form
    clearMutualFundForm();
  }
}

function clearStockForm() {
  const formElements = [
    "stockSymbol",
    "stockExchange",
    "stockQuantity",
    "stockPrice",
    "stockDate",
  ];
  formElements.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      if (element.type === "date") {
        element.value = new Date().toISOString().split("T")[0];
      } else {
        element.value = "";
      }
    }
  });

  // Clear search suggestions
  const stockSuggestions = document.getElementById("stockSuggestions");
  if (stockSuggestions) {
    stockSuggestions.innerHTML = "";
    stockSuggestions.classList.remove("show");
  }
}

function clearMutualFundForm() {
  const formElements = ["mfScheme", "mfUnits", "mfNAV", "mfAmount", "mfDate"];
  formElements.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      if (element.type === "date") {
        element.value = new Date().toISOString().split("T")[0];
      } else {
        element.value = "";
      }
    }
  });

  // Clear search suggestions
  const mfSuggestions = document.getElementById("mfSuggestions");
  if (mfSuggestions) {
    mfSuggestions.innerHTML = "";
    mfSuggestions.classList.remove("show");
  }
}

// Search functionality
let searchTimeout;

async function searchStocks(query) {
  if (!query || query.length < 2) {
    document.getElementById("stockSuggestions").classList.remove("show");
    return;
  }

  try {
    const response = await fetch(
      `/api/search/stocks?q=${encodeURIComponent(query)}`
    );
    if (response.ok) {
      const suggestions = await response.json();
      displayStockSuggestions(suggestions);
    }
  } catch (error) {
    console.error("Error searching stocks:", error);
  }
}

function displayStockSuggestions(suggestions) {
  const container = document.getElementById("stockSuggestions");
  if (!container) return;

  if (suggestions.length === 0) {
    container.classList.remove("show");
    return;
  }

  container.innerHTML = suggestions
    .map(
      (item) => `
    <div class="suggestion-item" onclick="selectStock('${item.symbol}', '${item.name}', '${item.exchange}')">
      <div class="suggestion-symbol">${item.symbol}</div>
      <div class="suggestion-name">${item.name}</div>
      <div class="suggestion-exchange">${item.exchange}</div>
    </div>
  `
    )
    .join("");

  container.classList.add("show");
}

function selectStock(symbol, name, exchange) {
  const stockSymbol = document.getElementById("stockSymbol");
  const stockExchange = document.getElementById("stockExchange");

  if (stockSymbol)
    stockSymbol.value = symbol.replace(".NS", "").replace(".BO", "");
  if (stockExchange) stockExchange.value = exchange;

  document.getElementById("stockSuggestions").classList.remove("show");
}

async function searchMutualFunds(query) {
  if (!query || query.length < 3) {
    document.getElementById("mfSuggestions").classList.remove("show");
    return;
  }

  try {
    const response = await fetch(
      `/api/mf/search?q=${encodeURIComponent(query)}`
    );
    if (response.ok) {
      const suggestions = await response.json();
      displayMutualFundSuggestions(suggestions);
    }
  } catch (error) {
    console.error("Error searching mutual funds:", error);
  }
}

function displayMutualFundSuggestions(suggestions) {
  const container = document.getElementById("mfSuggestions");
  if (!container) return;

  if (suggestions.length === 0) {
    container.classList.remove("show");
    return;
  }

  container.innerHTML = suggestions
    .map(
      (item) => `
    <div class="suggestion-item" onclick="selectMutualFund('${item.schemeCode}', '${item.schemeName}')">
      <div class="suggestion-symbol">${item.schemeCode}</div>
      <div class="suggestion-name">${item.schemeName}</div>
    </div>
  `
    )
    .join("");

  container.classList.add("show");
}

function selectMutualFund(schemeCode, schemeName) {
  const mfScheme = document.getElementById("mfScheme");

  if (mfScheme) mfScheme.value = schemeCode;

  document.getElementById("mfSuggestions").classList.remove("show");
}

// Add investment functions
async function addStock() {
  const symbol = document.getElementById("stockSymbol").value.trim();
  const exchange = document.getElementById("stockExchange").value;
  const quantity = parseFloat(document.getElementById("stockQuantity").value);
  const price = parseFloat(document.getElementById("stockPrice").value);
  const date = document.getElementById("stockDate").value;

  if (!symbol || !quantity || !price || !date) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  try {
    const response = await fetch("/api/portfolio/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        exchange,
        quantity,
        purchasePrice: price,
        purchaseDate: date,
      }),
    });

    if (response.ok) {
      showNotification("Stock added successfully!", "success");
      hideAddInvestmentModal();
      await loadPortfolio();
    } else {
      const error = await response.json();
      showNotification(error.error || "Failed to add stock", "error");
    }
  } catch (error) {
    console.error("Error adding stock:", error);
    showNotification("Failed to add stock", "error");
  }
}

async function addMutualFund() {
  const schemeCode = document.getElementById("mfScheme").value.trim();
  const units = parseFloat(document.getElementById("mfUnits").value);
  const nav = parseFloat(document.getElementById("mfNAV").value);
  const amount = parseFloat(document.getElementById("mfAmount").value);
  const date = document.getElementById("mfDate").value;

  if (!schemeCode || !date) {
    showNotification("Please fill in the scheme and date", "error");
    return;
  }

  if (!units && !amount) {
    showNotification("Please enter either units or investment amount", "error");
    return;
  }

  try {
    const requestBody = {
      schemeCode,
      purchaseDate: date,
    };

    if (units) requestBody.units = units;
    if (nav) requestBody.purchaseNAV = nav;
    if (amount) requestBody.investedAmount = amount;

    const response = await fetch("/api/portfolio/mutual-fund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      showNotification("Mutual fund added successfully!", "success");
      hideAddInvestmentModal();
      await loadPortfolio();
    } else {
      const error = await response.json();
      showNotification(error.error || "Failed to add mutual fund", "error");
    }
  } catch (error) {
    console.error("Error adding mutual fund:", error);
    showNotification("Failed to add mutual fund", "error");
  }
}

// Delete functions
function deleteStock(stockId) {
  currentDeleteItem = { type: "stock", id: stockId };
  document.getElementById("confirmDeleteModal").style.display = "flex";
}

function deleteMutualFund(mfId) {
  currentDeleteItem = { type: "mutualfund", id: mfId };
  document.getElementById("confirmDeleteModal").style.display = "flex";
}

function hideConfirmDeleteModal() {
  document.getElementById("confirmDeleteModal").style.display = "none";
  currentDeleteItem = null;
}

async function confirmDelete() {
  if (!currentDeleteItem) return;

  try {
    const endpoint =
      currentDeleteItem.type === "stock"
        ? `/api/portfolio/stock/${currentDeleteItem.id}`
        : `/api/portfolio/mutual-fund/${currentDeleteItem.id}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
    });

    if (response.ok) {
      showNotification("Investment deleted successfully!", "success");
      hideConfirmDeleteModal();
      await loadPortfolio();
    } else {
      showNotification("Failed to delete investment", "error");
    }
  } catch (error) {
    console.error("Error deleting investment:", error);
    showNotification("Failed to delete investment", "error");
  }
}

// Edit functions (placeholder for future implementation)
function editStock(stockId) {
  showNotification("Edit functionality coming soon!", "info");
}

function editMutualFund(mfId) {
  showNotification("Edit functionality coming soon!", "info");
}

// Chart functionality (placeholder for future implementation)
function updateChartPeriod(period) {
  const buttons = document.querySelectorAll(".time-btn");
  buttons.forEach((btn) => btn.classList.remove("active"));

  event.target.classList.add("active");

  // TODO: Implement chart update logic
  console.log("Updating chart for period:", period);
}

// Event listeners
document.addEventListener("DOMContentLoaded", async function () {
  // Load user data and initialize
  await loadUserData();

  // Check if user is logged in
  const session = getCurrentSession();
  if (session) {
    showPage("dashboard");
    await loadPortfolio();
  } else {
    showPage("login");
  }

  // Set up search event listeners
  const stockSymbolInput = document.getElementById("stockSymbol");
  if (stockSymbolInput) {
    stockSymbolInput.addEventListener("input", function (e) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchStocks(e.target.value);
      }, 300);
    });
  }

  const mfSchemeInput = document.getElementById("mfScheme");
  if (mfSchemeInput) {
    mfSchemeInput.addEventListener("input", function (e) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchMutualFunds(e.target.value);
      }, 300);
    });
  }

  // Close suggestions when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-input-container")) {
      document.querySelectorAll(".search-suggestions").forEach((s) => {
        s.classList.remove("show");
      });
    }
  });

  // Close modals when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });
});

// Profile settings functionality (legacy support)
function toggleProfileDropdown() {
  // Implementation for profile dropdown
}

function selectFieldToEdit(field) {
  // Implementation for field editing
}

function saveFieldEdit() {
  // Implementation for saving field edits
}

function cancelEdit() {
  // Implementation for canceling edits
}
