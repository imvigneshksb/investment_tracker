// Storage utility functions for userData.json management
let userData = { users: {}, sessions: {}, appSettings: {} };

// ============================
// BUTTON STATE MANAGEMENT
// ============================

/**
 * Reset button to default state by removing focus and active states
 * @param {HTMLElement|string} button - Button element or selector
 */
function resetButtonState(button) {
  const btnElement =
    typeof button === "string" ? document.querySelector(button) : button;
  if (btnElement) {
    // Remove focus and blur the button
    btnElement.blur();

    // Remove any active/pressed states
    btnElement.classList.remove("active", "pressed", "btn-loading");

    // Reset any inline styles that might persist (removed transform since we don't use it)
    btnElement.style.boxShadow = "";

    // Remove any temporary disabled state
    if (!btnElement.hasAttribute("data-originally-disabled")) {
      btnElement.disabled = false;
    }
  }
}

/**
 * Reset all buttons in a container to default state
 * @param {HTMLElement|string} container - Container element or selector
 */
function resetAllButtonStates(container = document) {
  const containerElement =
    typeof container === "string"
      ? document.querySelector(container)
      : container;
  if (containerElement) {
    const buttons = containerElement.querySelectorAll(".btn-primary, button");
    buttons.forEach((button) => resetButtonState(button));
  }
}

/**
 * Add loading state to button
 * @param {HTMLElement|string} button - Button element or selector
 * @param {string} loadingText - Optional loading text
 */
function setButtonLoading(button, loadingText = "") {
  const btnElement =
    typeof button === "string" ? document.querySelector(button) : button;
  if (btnElement) {
    btnElement.classList.add("btn-loading");
    if (loadingText) {
      btnElement.setAttribute("data-original-text", btnElement.textContent);
      btnElement.textContent = loadingText;
    }
    btnElement.disabled = true;
  }
}

/**
 * Remove loading state from button
 * @param {HTMLElement|string} button - Button element or selector
 */
function removeButtonLoading(button) {
  const btnElement =
    typeof button === "string" ? document.querySelector(button) : button;
  if (btnElement) {
    btnElement.classList.remove("btn-loading");
    const originalText = btnElement.getAttribute("data-original-text");
    if (originalText) {
      btnElement.textContent = originalText;
      btnElement.removeAttribute("data-original-text");
    }
    btnElement.disabled = false;
    resetButtonState(btnElement);
  }
}

// ============================
// END BUTTON STATE MANAGEMENT
// ============================

// Load userData from secure server API
async function loadUserData() {
  try {
    // Check authentication status first
    const authResponse = await fetch("/api/auth/verify", {
      credentials: 'include'
    });
    
    if (!authResponse.ok) {
      // User not authenticated, redirect to login
      if (window.location.pathname !== '/login.html' && 
          window.location.pathname !== '/signup.html' &&
          window.location.pathname !== '/index.html') {
        window.location.href = 'login.html';
        return;
      }
      
      // Initialize empty userData for login/signup pages
      userData = { users: {}, sessions: {}, appSettings: {} };
      return;
    }
    
    const authData = await authResponse.json();
    currentUser = authData.user;
    
    // Load portfolio data from server
    const response = await fetch("/api/loadUserData", {
      credentials: 'include'
    });
    
    if (response.ok) {
      const portfolioData = await response.json();
      // Structure the data properly for the app
      userData = {
        users: {
          [currentUser.email]: {
            ...currentUser,
            portfolio: portfolioData
          }
        },
        sessions: {},
        appSettings: {}
      };
      console.log("✅ User portfolio loaded from secure server");
    } else {
      throw new Error("Failed to load portfolio data");
    }
    
  } catch (error) {
    console.error("Error loading user data:", error);
    
    // If not on login/signup pages, redirect to login
    if (window.location.pathname !== '/login.html' && 
        window.location.pathname !== '/signup.html' &&
        window.location.pathname !== '/index.html') {
      window.location.href = 'login.html';
      return;
    }
    
    // Initialize empty userData for login/signup pages
    userData = { users: {}, sessions: {}, appSettings: {} };
  }
}

// Save userData to secure server API
async function saveUserData() {
  try {
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    // Extract portfolio data to save
    const portfolioData = userData.users[currentUser.email]?.portfolio || {
      stocks: [],
      totalValue: 0,
      totalInvestment: 0,
      profit: 0,
      profitPercentage: 0
    };

    const response = await fetch("/api/saveUserData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(portfolioData),
    });

    if (response.ok) {
      console.log("✅ Portfolio data saved securely to server");
    } else {
      const error = await response.json();
      throw new Error(error.error || "Failed to save portfolio data");
    }
  } catch (error) {
    console.error("❌ Error saving portfolio data:", error);
    showNotification("Failed to save portfolio data. Please try again.", "error");
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

// Remove user data by email
async function removeUserData(email) {
  delete userData.users[email];
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
    errorElement.classList.add("show");
  }
}

function hideError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = "";
    errorElement.classList.remove("show");
  }
}

function clearAllErrors() {
  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach((element) => {
    element.textContent = "";
    element.classList.remove("show");
  });
}

function clearAllInputs() {
  // Clear login form inputs
  const loginInputs = ["email", "password"];
  loginInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = "";
    }
  });

  // Clear signup form inputs
  const signupInputs = [
    "fullName",
    "signupEmail",
    "signupPassword",
    "confirmPassword",
  ];
  signupInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = "";
    }
  });
}

function clearAllErrorsAndInputs() {
  clearAllErrors();
  clearAllInputs();
}

// Setup input event listeners to hide errors on typing
function setupInputErrorHandling() {
  const inputFieldMappings = [
    { inputId: "email", errorId: "loginEmailError" },
    { inputId: "password", errorId: "loginPasswordError" },
    { inputId: "fullName", errorId: "fullNameError" },
    { inputId: "signupEmail", errorId: "signupEmailError" },
    { inputId: "signupPassword", errorId: "signupPasswordError" },
    { inputId: "confirmPassword", errorId: "confirmPasswordError" },
  ];

  inputFieldMappings.forEach((mapping) => {
    const inputElement = document.getElementById(mapping.inputId);
    if (inputElement) {
      // Hide error on input (typing)
      inputElement.addEventListener("input", function () {
        hideError(mapping.errorId);
      });

      // Hide error on blur (focus change) if field has content
      inputElement.addEventListener("blur", function () {
        if (this.value.trim()) {
          hideError(mapping.errorId);
        }
      });
    }
  });
}

// Setup keyboard navigation and form submission
function setupKeyboardNavigation() {
  // Login form keyboard support
  const loginSection = document.getElementById("loginSection");
  const signupSection = document.getElementById("signupSection");

  // Login form Enter key support
  if (loginSection) {
    const loginInputs = loginSection.querySelectorAll(".input-field");
    loginInputs.forEach((input, index) => {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();

          // If it's the last input or password field, submit the form
          if (index === loginInputs.length - 1 || input.type === "password") {
            handleLogin();
          } else {
            // Focus next input
            const nextInput = loginInputs[index + 1];
            if (nextInput) nextInput.focus();
          }
        }

        // Tab navigation enhancement
        if (
          e.key === "Tab" &&
          !e.shiftKey &&
          index === loginInputs.length - 1
        ) {
          // Focus the login button after last input
          setTimeout(() => {
            const loginBtn = loginSection.querySelector(".login-btn");
            if (loginBtn) loginBtn.focus();
          }, 0);
        }
      });
    });

    // Login button keyboard support
    const loginBtn = loginSection.querySelector(".login-btn");
    if (loginBtn) {
      loginBtn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleLogin();
        }
      });
    }
  }

  // Signup form Enter key support
  if (signupSection) {
    const signupInputs = signupSection.querySelectorAll(".input-field");
    signupInputs.forEach((input, index) => {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();

          // If it's the last required input, submit the form
          if (
            index === signupInputs.length - 1 ||
            input.id === "confirmPassword"
          ) {
            handleSignup();
          } else {
            // Focus next input
            const nextInput = signupInputs[index + 1];
            if (nextInput) nextInput.focus();
          }
        }
      });
    });

    // Signup button keyboard support
    const signupBtn = signupSection.querySelector(".signup-btn");
    if (signupBtn) {
      signupBtn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSignup();
        }
      });
    }
  }

  // Profile dropdown keyboard support
  document.addEventListener("keydown", function (e) {
    const profileIcon = document.querySelector(".profile-icon");
    const dropdown = document.querySelector(".dropdown");

    // Escape key to close dropdown
    if (e.key === "Escape" && dropdown && dropdown.style.display === "block") {
      dropdown.style.display = "none";
      if (profileIcon) profileIcon.focus();
    }

    // Enter/Space on profile icon
    if (
      document.activeElement === profileIcon &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      toggleProfileMenu();
    }
  });

  // Close details dropdown when clicking outside
  document.addEventListener("click", function (e) {
    const detailsDropdown = document.getElementById("detailsDropdownMenu");
    const detailsButton = document.querySelector(".details-dropdown-button");
    const detailsContainer = document.querySelector(
      ".details-dropdown-container"
    );

    if (detailsDropdown && detailsButton && detailsContainer) {
      // If click is outside the entire dropdown container
      if (!detailsContainer.contains(e.target)) {
        detailsDropdown.style.display = "none";
        detailsButton.classList.remove("open");
        detailsButton.setAttribute("aria-expanded", "false");
      }
    }

    // Close stock exchange dropdown when clicking outside
    const stockExchangeDropdown = document.getElementById(
      "stockExchangeDropdownMenu"
    );
    const stockExchangeButton = document.querySelector(
      ".stock-exchange-dropdown-button"
    );
    const stockExchangeContainer = document.querySelector(
      ".stock-exchange-dropdown-container"
    );

    if (
      stockExchangeDropdown &&
      stockExchangeButton &&
      stockExchangeContainer
    ) {
      // If click is outside the entire dropdown container
      if (!stockExchangeContainer.contains(e.target)) {
        stockExchangeDropdown.style.display = "none";
        stockExchangeButton.classList.remove("open");
        stockExchangeButton.setAttribute("aria-expanded", "false");
      }
    }
  });

  // Global escape key handler for details dropdown
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const detailsDropdown = document.getElementById("detailsDropdownMenu");
      const detailsButton = document.querySelector(".details-dropdown-button");

      if (detailsDropdown && detailsDropdown.style.display === "block") {
        detailsDropdown.style.display = "none";
        detailsButton.classList.remove("open");
        detailsButton.setAttribute("aria-expanded", "false");
        detailsButton.focus();
      }

      // Handle stock exchange dropdown escape
      const stockExchangeDropdown = document.getElementById(
        "stockExchangeDropdownMenu"
      );
      const stockExchangeButton = document.querySelector(
        ".stock-exchange-dropdown-button"
      );

      if (
        stockExchangeDropdown &&
        stockExchangeDropdown.style.display === "block"
      ) {
        stockExchangeDropdown.style.display = "none";
        stockExchangeButton.classList.remove("open");
        stockExchangeButton.setAttribute("aria-expanded", "false");
        stockExchangeButton.focus();
      }
    }
  });

  // Make profile icon focusable
  const profileIcon = document.querySelector(".profile-icon");
  if (profileIcon) {
    profileIcon.setAttribute("tabindex", "0");
    profileIcon.setAttribute("role", "button");
    profileIcon.setAttribute("aria-label", "User profile menu");
  }

  // Make profile menu items focusable and keyboard accessible
  const profileMenuItems = document.querySelectorAll(".profile-menu-item");
  profileMenuItems.forEach((item, index) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "menuitem");

    item.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      }

      // Arrow key navigation in dropdown
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextItem = profileMenuItems[index + 1];
        if (nextItem) nextItem.focus();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevItem = profileMenuItems[index - 1];
        if (prevItem) prevItem.focus();
      }
    });
  });

  // Make details dropdown button focusable and keyboard accessible
  const detailsDropdownButton = document.querySelector(
    ".details-dropdown-button"
  );
  if (detailsDropdownButton) {
    detailsDropdownButton.setAttribute("tabindex", "0");
    detailsDropdownButton.setAttribute("role", "combobox");
    detailsDropdownButton.setAttribute("aria-haspopup", "listbox");
    detailsDropdownButton.setAttribute("aria-expanded", "false");

    detailsDropdownButton.addEventListener("keydown", function (e) {
      const detailsDropdown = document.getElementById("detailsDropdownMenu");
      const detailsMenuItems = document.querySelectorAll(".details-menu-item");

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (
          detailsDropdown.style.display === "none" ||
          detailsDropdown.style.display === ""
        ) {
          // Open dropdown and focus selected or first item
          detailsDropdown.style.display = "block";
          this.classList.add("open");
          this.setAttribute("aria-expanded", "true");
          setTimeout(() => {
            positionDropdownSafely(detailsDropdown, this);
            updateVisualSelection();
            focusSelectedOrFirstOption();
          }, 10);
        } else if (detailsMenuItems.length > 0) {
          // If already open, focus selected or first item
          focusSelectedOrFirstOption();
        }
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (
          detailsDropdown.style.display === "none" ||
          detailsDropdown.style.display === ""
        ) {
          // Open dropdown and focus selected or last item
          detailsDropdown.style.display = "block";
          this.classList.add("open");
          this.setAttribute("aria-expanded", "true");
          setTimeout(() => {
            positionDropdownSafely(detailsDropdown, this);
            const currentSelection = getCurrentlySelectedOption();
            if (currentSelection && detailsMenuItems.length > 0) {
              // Find and focus the currently selected item
              for (let item of detailsMenuItems) {
                const itemText = item.textContent.trim();
                if (itemText === currentSelection) {
                  item.focus();
                  return;
                }
              }
            }
            // If no selection, focus last item
            if (detailsMenuItems.length > 0) {
              detailsMenuItems[detailsMenuItems.length - 1].focus();
            }
          }, 10);
        } else if (detailsMenuItems.length > 0) {
          // If already open, focus last item
          detailsMenuItems[detailsMenuItems.length - 1].focus();
        }
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDetailsDropdown();
        // Don't auto-focus when opening with Enter/Space - let user choose with arrows
      }
    });
  }

  // Make details menu items focusable and keyboard accessible
  const detailsMenuItems = document.querySelectorAll(".details-menu-item");
  detailsMenuItems.forEach((item, index) => {
    item.setAttribute("tabindex", "-1"); // Not in normal tab order
    item.setAttribute("role", "option");

    // Add focus event listener to manage visual selection
    item.addEventListener("focus", function () {
      // Clear selected class from all items and add to focused item
      const allItems = document.querySelectorAll(".details-menu-item");
      allItems.forEach((i) => i.classList.remove("selected"));
      this.classList.add("selected");
    });

    item.addEventListener("keydown", function (e) {
      const currentMenuItems = document.querySelectorAll(".details-menu-item");
      const currentIndex = Array.from(currentMenuItems).indexOf(this);

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
        // Close dropdown and return focus to button
        const detailsDropdown = document.getElementById("detailsDropdownMenu");
        const button = document.querySelector(".details-dropdown-button");
        if (detailsDropdown) detailsDropdown.style.display = "none";
        if (button) {
          button.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          button.focus();
        }
        return;
      }

      // Arrow key navigation with cycling
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % currentMenuItems.length;
        // Clear selected classes and add to focused item
        currentMenuItems.forEach((item) => item.classList.remove("selected"));
        currentMenuItems[nextIndex].classList.add("selected");
        currentMenuItems[nextIndex].focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          currentIndex === 0 ? currentMenuItems.length - 1 : currentIndex - 1;
        // Clear selected classes and add to focused item
        currentMenuItems.forEach((item) => item.classList.remove("selected"));
        currentMenuItems[prevIndex].classList.add("selected");
        currentMenuItems[prevIndex].focus();
      }

      // Home key - go to first item
      if (e.key === "Home") {
        e.preventDefault();
        currentMenuItems.forEach((item) => item.classList.remove("selected"));
        currentMenuItems[0].classList.add("selected");
        currentMenuItems[0].focus();
      }

      // End key - go to last item
      if (e.key === "End") {
        e.preventDefault();
        currentMenuItems.forEach((item) => item.classList.remove("selected"));
        currentMenuItems[currentMenuItems.length - 1].classList.add("selected");
        currentMenuItems[currentMenuItems.length - 1].focus();
      }

      // Escape key - close dropdown and return focus to button
      if (e.key === "Escape") {
        e.preventDefault();
        const detailsDropdown = document.getElementById("detailsDropdownMenu");
        const button = document.querySelector(".details-dropdown-button");
        if (detailsDropdown) detailsDropdown.style.display = "none";
        if (button) {
          button.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          button.focus();
        }
      }
    });
  });

  // Password toggle keyboard support
  const passwordToggles = document.querySelectorAll(".password-toggle");
  passwordToggles.forEach((toggle) => {
    toggle.setAttribute("tabindex", "0");
    toggle.setAttribute("role", "button");
    toggle.setAttribute("aria-label", "Toggle password visibility");

    toggle.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      }
    });
  });

  // Add window resize listener to reposition dropdown if needed
  window.addEventListener("resize", function () {
    const dropdown = document.getElementById("detailsDropdownMenu");
    const button = document.querySelector(".details-dropdown-button");
    if (dropdown && dropdown.style.display === "block" && button) {
      setTimeout(() => {
        positionDropdownSafely(dropdown, button);
      }, 100);
    }
  });

  // Stock exchange dropdown keyboard accessibility
  setupStockExchangeDropdownAccessibility();
}

// Setup keyboard accessibility for stock exchange dropdown
function setupStockExchangeDropdownAccessibility() {
  const stockExchangeButton = document.querySelector(
    ".stock-exchange-dropdown-button"
  );
  if (!stockExchangeButton) return; // Dropdown might not be present on all pages

  stockExchangeButton.addEventListener("keydown", function (e) {
    const stockExchangeDropdown = document.getElementById(
      "stockExchangeDropdownMenu"
    );
    const stockExchangeMenuItems = document.querySelectorAll(
      ".stock-exchange-menu-item"
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (
        stockExchangeDropdown.style.display === "none" ||
        stockExchangeDropdown.style.display === ""
      ) {
        // Open dropdown and focus first item
        stockExchangeDropdown.style.display = "block";
        this.classList.add("open");
        this.setAttribute("aria-expanded", "true");
        setTimeout(() => {
          if (stockExchangeMenuItems.length > 0) {
            stockExchangeMenuItems[0].focus();
          }
        }, 10);
      } else if (stockExchangeMenuItems.length > 0) {
        // If already open, focus first item
        stockExchangeMenuItems[0].focus();
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (
        stockExchangeDropdown.style.display === "none" ||
        stockExchangeDropdown.style.display === ""
      ) {
        // Open dropdown and focus last item
        stockExchangeDropdown.style.display = "block";
        this.classList.add("open");
        this.setAttribute("aria-expanded", "true");
        setTimeout(() => {
          if (stockExchangeMenuItems.length > 0) {
            stockExchangeMenuItems[stockExchangeMenuItems.length - 1].focus();
          }
        }, 10);
      } else if (stockExchangeMenuItems.length > 0) {
        // If already open, focus last item
        stockExchangeMenuItems[stockExchangeMenuItems.length - 1].focus();
      }
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleStockExchangeDropdown();
    }
  });

  // Make stock exchange menu items focusable and keyboard accessible
  const stockExchangeMenuItems = document.querySelectorAll(
    ".stock-exchange-menu-item"
  );
  stockExchangeMenuItems.forEach((item, index) => {
    item.setAttribute("tabindex", "-1");
    item.setAttribute("role", "option");

    // Add focus event listener to manage visual selection
    item.addEventListener("focus", function () {
      const allItems = document.querySelectorAll(".stock-exchange-menu-item");
      allItems.forEach((i) => i.classList.remove("selected"));
      this.classList.add("selected");
    });

    item.addEventListener("keydown", function (e) {
      const currentMenuItems = document.querySelectorAll(
        ".stock-exchange-menu-item"
      );
      const currentIndex = Array.from(currentMenuItems).indexOf(this);

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
        // Close dropdown and return focus to button
        const stockExchangeDropdown = document.getElementById(
          "stockExchangeDropdownMenu"
        );
        const button = document.querySelector(
          ".stock-exchange-dropdown-button"
        );
        if (stockExchangeDropdown) stockExchangeDropdown.style.display = "none";
        if (button) {
          button.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          button.focus();
        }
        return;
      }

      // Arrow key navigation with cycling
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % currentMenuItems.length;
        currentMenuItems.forEach((item) => item.classList.remove("selected"));
        currentMenuItems[nextIndex].classList.add("selected");
        currentMenuItems[nextIndex].focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          currentIndex === 0 ? currentMenuItems.length - 1 : currentIndex - 1;
        currentMenuItems.forEach((item) => item.classList.remove("selected"));
        currentMenuItems[prevIndex].classList.add("selected");
        currentMenuItems[prevIndex].focus();
      }

      // Home key - go to first item
      if (e.key === "Home") {
        e.preventDefault();
        currentMenuItems.forEach((item) => item.classList.remove("selected"));
        currentMenuItems[0].classList.add("selected");
        currentMenuItems[0].focus();
      }

      // End key - go to last item
      if (e.key === "End") {
        e.preventDefault();
        currentMenuItems.forEach((item) => item.classList.remove("selected"));
        currentMenuItems[currentMenuItems.length - 1].classList.add("selected");
        currentMenuItems[currentMenuItems.length - 1].focus();
      }

      // Escape key - close dropdown and return focus to button
      if (e.key === "Escape") {
        e.preventDefault();
        const stockExchangeDropdown = document.getElementById(
          "stockExchangeDropdownMenu"
        );
        const button = document.querySelector(
          ".stock-exchange-dropdown-button"
        );
        if (stockExchangeDropdown) stockExchangeDropdown.style.display = "none";
        if (button) {
          button.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          button.focus();
        }
      }
    });
  });
}

// Profile dropdown toggle function
function toggleProfileMenu() {
  const dropdown = document.querySelector(".dropdown");
  if (dropdown) {
    const currentDisplay = dropdown.style.display;
    dropdown.style.display = currentDisplay === "block" ? "none" : "block";
  }
}

// Profile settings function
async function showProfileSettings() {
  // Update current session with profile page
  const currentSession = getCurrentSession();
  if (currentSession) {
    await setCurrentSession({
      ...currentSession,
      currentPage: "profile-settings",
    });
  }

  // Redirect to profile page
  window.location.href = "profile.html";
}

// Load current user data into profile settings form
function loadProfileData() {
  const currentSession = getCurrentSession();
  if (!currentSession) return;

  // Pre-populate email field
  document.getElementById("profileEmail").value = currentSession.email || "";

  // Pre-populate name field
  document.getElementById("profileFullName").value = currentSession.name || "";

  // Clear password fields (keep them empty)
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmNewPassword").value = "";
}

// Update profile function
async function updateProfile() {
  clearAllErrors();

  const fullName = document.getElementById("profileFullName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword =
    document.getElementById("confirmNewPassword").value;

  // Validate new password if provided
  if (newPassword) {
    if (newPassword.length < 6) {
      showError(
        "newPasswordError",
        "New password must be at least 6 characters"
      );
      return;
    }

    // Confirm new password is required if new password is provided
    if (!confirmNewPassword) {
      showError("confirmNewPasswordError", "Confirm new password is required");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showError("confirmNewPasswordError", "New passwords do not match");
      return;
    }
  }

  // Validate email format only if email is provided
  if (email && !isValidEmail(email)) {
    showError("profileEmailError", "Please enter a valid email address");
    return;
  }

  // Get current user to check if email is changing
  const currentSession = getCurrentSession();
  if (!currentSession) {
    showError("profileEmailError", "User session not found");
    return;
  }

  const originalEmail = currentSession.email;

  // Use original email if no new email provided
  const finalEmail = email || originalEmail;

  // Check if new email already exists (if email is being changed)
  if (email && email !== originalEmail) {
    const existingUser = getUserData(email);
    if (existingUser) {
      showError("profileEmailError", "Email already registered");
      return;
    }
  }

  // Get current user data
  const currentUserData = getUserData(originalEmail);
  if (!currentUserData) {
    showError("profileEmailError", "User data not found");
    return;
  }

  // Update user data - only update fields that are provided
  const updatedUserData = {
    ...currentUserData,
    fullName: fullName || currentUserData.fullName, // Keep existing name if not provided
    email: finalEmail, // Use finalEmail (either new email or original)
    password: newPassword || currentUserData.password, // Keep existing password if no new password
  };

  // If email changed, remove old data and save with new key
  if (finalEmail !== originalEmail) {
    await removeUserData(originalEmail); // Remove old email key
  }

  // Save updated data with current email key
  await setUserData(finalEmail, updatedUserData);

  // Update current user session
  const updatedSessionData = {
    name: fullName || currentUserData.fullName, // Use existing name if not provided
    email: finalEmail,
    currentPage: "dashboard",
  };
  await setCurrentSession(updatedSessionData);

  // Update header profile
  updateHeaderProfile();

  // Show success message and go back to dashboard
  alert("Profile updated successfully!");
  await setCurrentSession({
    ...updatedSessionData,
    currentPage: "dashboard",
  });
  showDashboard();
}

// Cancel profile settings
async function cancelProfileSettings() {
  clearAllErrors();

  // Go back to dashboard
  await setCurrentSession({
    ...getCurrentSession(),
    currentPage: "dashboard",
  });
  window.location.href = "dashboard.html";
}

// Show delete account confirmation modal
function confirmDeleteAccount() {
  // Store the element that triggered the modal for focus restoration
  modalTriggerElement = document.activeElement;

  // Create and show confirmation modal
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "deleteAccountModal";
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-labelledby="deleteModalTitle" aria-modal="true">
      <div class="modal-header">
        <h3 id="deleteModalTitle">Delete Account</h3>
        <span class="close" onclick="hideDeleteAccountModal()" aria-label="Close modal" tabindex="0" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); hideDeleteAccountModal(); }">&times;</span>
      </div>
      <div class="modal-body">
        <div class="delete-confirmation-content">
          <div class="warning-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="warning-text">
            <p><strong>Are you sure you want to delete your account?</strong></p>
            <p>This action cannot be undone and will permanently delete:</p>
            <ul>
              <li>All your stock investments</li>
              <li>All your mutual fund investments</li>
              <li>Your profile information</li>
              <li>All financial data and history</li>
            </ul>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-primary btn-danger" onclick="proceedWithDeleteAccount()">Delete Account</button>
          <button type="button" class="btn-secondary" onclick="hideDeleteAccountModal()">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Show the modal
  modal.style.display = "block";

  // Freeze the main window
  freezeMainWindow();

  // Add escape key handler specifically for this modal
  const escapeHandler = function (e) {
    if (e.key === "Escape") {
      hideDeleteAccountModal();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);

  // Add slight delay to ensure smooth modal appearance
  setTimeout(() => {
    const modalContent = modal.querySelector(".modal-content");
    modalContent.focus();

    // Setup modal focus trap
    setupModalFocusTrap(modal);
  }, 100);
}

// Hide delete account confirmation modal
function hideDeleteAccountModal() {
  const modal = document.getElementById("deleteAccountModal");
  if (modal) {
    // Reset all button states in the modal before removing
    resetAllButtonStates(modal);

    modal.remove();

    // Unfreeze the main window
    unfreezeMainWindow();

    // Restore focus to the element that opened the modal, then blur after a short delay
    if (modalTriggerElement) {
      modalTriggerElement.focus();

      // Remove focus outline after a short delay to prevent persistent focus styles
      setTimeout(() => {
        resetButtonState(modalTriggerElement);
        modalTriggerElement = null;
      }, 100);
    }
  }
}

// Proceed with account deletion after confirmation
async function proceedWithDeleteAccount() {
  // Hide the modal first
  hideDeleteAccountModal();

  // Execute the delete account function
  await deleteAccount();
}

// Delete account function
async function deleteAccount() {
  try {
    const currentSession = getCurrentSession();
    if (!currentSession) {
      showErrorNotification("User session not found");
      return;
    }

    // Call server to delete user account
    const deleteResponse = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      credentials: 'include'
    });

    if (!deleteResponse.ok) {
      throw new Error("Failed to delete account on server");
    }

    // Clear client-side state
    currentUser = null;
    userData = { users: {}, sessions: {}, appSettings: {} };

    // Show single success message
    showSuccessNotification("Account deleted successfully.");

    // Redirect to login page after a short delay to allow user to see the message
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (error) {
    console.error("Error deleting account:", error);
    showErrorNotification("Failed to delete account. Please try again.");
  }
}

// Edit Name function
async function editName() {
  const currentSession = getCurrentSession();
  if (!currentSession) {
    showErrorNotification("User session not found");
    return;
  }

  const currentName = currentSession.name || "";
  const newName = prompt("Enter your new name:", currentName);

  if (newName === null) return; // User cancelled

  const trimmedName = newName.trim();

  // Get current user data
  const currentUserData = getUserData(currentSession.email);
  if (!currentUserData) {
    showErrorNotification("User data not found");
    return;
  } // Update user data
  const updatedUserData = {
    ...currentUserData,
    fullName: trimmedName,
  };

  // Save updated data
  await setUserData(currentSession.email, updatedUserData);

  // Update current user session
  const updatedSessionData = {
    ...currentSession,
    name: trimmedName,
  };
  await setCurrentSession(updatedSessionData);

  // Update header profile
  updateHeaderProfile();

  showSuccessNotification("Name updated successfully!");
}

// Edit Email function
async function editEmail() {
  const currentSession = getCurrentSession();
  if (!currentSession) {
    alert("User session not found");
    return;
  }

  const currentEmail = currentSession.email || "";
  const newEmail = prompt("Enter your new email:", currentEmail);

  if (newEmail === null) return; // User cancelled

  const trimmedEmail = newEmail.trim();

  if (!trimmedEmail) {
    alert("Email cannot be empty");
    return;
  }

  // Validate email format
  if (!isValidEmail(trimmedEmail)) {
    alert("Please enter a valid email address");
    return;
  }

  // Check if new email already exists (if email is being changed)
  if (trimmedEmail !== currentEmail) {
    const existingUser = getUserData(trimmedEmail);
    if (existingUser) {
      alert("Email already registered");
      return;
    }
  }

  // Get current user data
  const currentUserData = getUserData(currentEmail);
  if (!currentUserData) {
    alert("User data not found");
    return;
  }

  // Update user data
  const updatedUserData = {
    ...currentUserData,
    email: trimmedEmail,
  };

  // If email changed, remove old data and save with new key
  if (trimmedEmail !== currentEmail) {
    await removeUserData(currentEmail); // Remove old email key
  }

  // Save updated data with new email key
  await setUserData(trimmedEmail, updatedUserData);

  // Update current user session
  const updatedSessionData = {
    ...currentSession,
    email: trimmedEmail,
  };
  await setCurrentSession(updatedSessionData);

  // Update header profile
  updateHeaderProfile();

  showSuccessNotification("Email updated successfully!");
}

// Edit Password function
async function editPassword() {
  const currentSession = getCurrentSession();
  if (!currentSession) {
    alert("User session not found");
    return;
  }

  const newPassword = prompt("Enter your new password:");

  if (newPassword === null) return; // User cancelled

  if (!newPassword) {
    alert("Password cannot be empty");
    return;
  }

  if (newPassword.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  const confirmPassword = prompt("Confirm your new password:");

  if (confirmPassword === null) return; // User cancelled

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  // Get current user data
  const currentUserData = getUserData(currentSession.email);
  if (!currentUserData) {
    alert("User data not found");
    return;
  }

  // Update user data
  const updatedUserData = {
    ...currentUserData,
    password: newPassword,
  };

  // Save updated data
  await setUserData(currentSession.email, updatedUserData);

  showSuccessNotification("Password updated successfully!");
}

// Toggle details update dropdown visibility (separate from profile menu)
function toggleDetailsDropdown() {
  const dropdown = document.getElementById("detailsDropdownMenu");
  const button = document.querySelector(".details-dropdown-button");

  if (dropdown.style.display === "none" || dropdown.style.display === "") {
    dropdown.style.display = "block";
    button.classList.add("open");
    button.setAttribute("aria-expanded", "true");

    // Check positioning to avoid header overlap
    setTimeout(() => {
      positionDropdownSafely(dropdown, button);
      updateVisualSelection();
      // Only auto-focus if button currently has focus (opened via keyboard)
      // Don't auto-focus for mouse clicks
    }, 10);
  } else {
    dropdown.style.display = "none";
    button.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
  }
}

// Legacy function for backward compatibility - now calls details dropdown
function toggleProfileDropdown() {
  toggleDetailsDropdown();
}

// Update details dropdown button text with selected option
function selectDetailsDropdownOption(optionName) {
  const buttonText = document.getElementById("detailsDropdownButtonText");
  if (buttonText) {
    buttonText.textContent = optionName;
  }

  // Remove selected class from all items since we're selecting a new one
  const detailsMenuItems = document.querySelectorAll(".details-menu-item");
  detailsMenuItems.forEach((item) => item.classList.remove("selected"));
}

// Stock Exchange Dropdown Functions
function toggleStockExchangeDropdown() {
  const dropdown = document.getElementById("stockExchangeDropdownMenu");
  const button = document.querySelector(".stock-exchange-dropdown-button");

  if (dropdown.style.display === "none" || dropdown.style.display === "") {
    dropdown.style.display = "block";
    button.classList.add("open");
    button.setAttribute("aria-expanded", "true");
  } else {
    dropdown.style.display = "none";
    button.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
  }
}

function selectStockExchangeOption(optionValue) {
  const buttonText = document.getElementById("stockExchangeButtonText");
  const hiddenInput = document.getElementById("stockExchange");
  const dropdown = document.getElementById("stockExchangeDropdownMenu");
  const button = document.querySelector(".stock-exchange-dropdown-button");

  if (buttonText) {
    buttonText.textContent = optionValue;
  }

  if (hiddenInput) {
    hiddenInput.value = optionValue;
  }

  // Hide error when selection is made
  hideStockModalError("stockExchangeError");

  // Close dropdown
  if (dropdown) {
    dropdown.style.display = "none";
  }
  if (button) {
    button.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
  }

  // Remove selected class from all items and add to clicked item
  const stockExchangeMenuItems = document.querySelectorAll(
    ".stock-exchange-menu-item"
  );
  stockExchangeMenuItems.forEach((item) => {
    item.classList.remove("selected");
    if (item.textContent.trim() === optionValue) {
      item.classList.add("selected");
    }
  });
}

// Legacy function for backward compatibility - now calls details dropdown
function selectDropdownOption(optionName) {
  selectDetailsDropdownOption(optionName);
}

// Hide details dropdown
function hideDetailsDropdown() {
  const dropdown = document.getElementById("detailsDropdownMenu");
  const button = document.querySelector(".details-dropdown-button");

  dropdown.style.display = "none";
  button.classList.remove("open");
}

// Legacy function for backward compatibility - now calls details dropdown
function hideProfileDropdown() {
  hideDetailsDropdown();
}

// Show edit field for selected option
function showEditField(fieldType) {
  const container = document.getElementById("editFieldContainer");
  const label = document.getElementById("fieldLabel");
  const input = document.getElementById("editFieldInput");
  const confirmGroup = document.getElementById("confirmPasswordGroup");
  const currentSession = getCurrentSession();

  // Check for both legacy and new dropdown containers
  const legacyDropdownContainer = document.querySelector(".dropdown-container");
  const detailsDropdownContainer = document.querySelector(
    ".details-dropdown-container"
  );

  // Keep dropdown container visible, but hide the dropdown menu
  if (detailsDropdownContainer) {
    detailsDropdownContainer.style.display = "block";
  } else if (legacyDropdownContainer) {
    legacyDropdownContainer.style.display = "block";
  }

  // Hide dropdown menus (both legacy and new)
  const legacyDropdown = document.getElementById("profileDropdownMenu");
  const detailsDropdown = document.getElementById("detailsDropdownMenu");

  if (detailsDropdown) {
    detailsDropdown.style.display = "none";
  }
  if (legacyDropdown) {
    legacyDropdown.style.display = "none";
  }

  // Remove open class from buttons (both legacy and new)
  const legacyButton = document.querySelector(".dropdown-button");
  const detailsButton = document.querySelector(".details-dropdown-button");

  if (detailsButton) {
    detailsButton.classList.remove("open");
  }
  if (legacyButton) {
    legacyButton.classList.remove("open");
  }

  // Hide back to dashboard button when editing
  const backButton = document.querySelector(".profile-settings-buttons");
  if (backButton) {
    backButton.style.display = "none";
  }

  // Clear previous values and errors
  clearAllErrors();

  if (fieldType === "name") {
    label.textContent = "Edit Name";
    input.type = "text";
    input.placeholder = "Enter your full name";
    input.value = currentSession?.name || "";
    confirmGroup.style.display = "none";
  } else if (fieldType === "email") {
    label.textContent = "Edit Email";
    input.type = "email";
    input.placeholder = "Enter your email address";
    input.value = currentSession?.email || "";
    confirmGroup.style.display = "none";
  } else if (fieldType === "password") {
    label.textContent = "Edit Password";
    input.type = "password";
    input.placeholder = "Enter new password";
    input.value = "";
    confirmGroup.style.display = "block";
  }

  // Store the current field type for saving
  container.setAttribute("data-field-type", fieldType);
  container.style.display = "block";

  // Remove auto-focus to prevent jumping to input field
  // setTimeout(() => input.focus(), 100);
}

// Cancel field edit
function cancelFieldEdit() {
  const container = document.getElementById("editFieldContainer");
  const backButton = document.querySelector(".profile-settings-buttons");

  // Handle both legacy and new dropdown systems
  const legacyDropdownButton = document.getElementById("dropdownButtonText");
  const legacyDropdownContainer = document.querySelector(".dropdown-container");
  const detailsDropdownContainer = document.querySelector(
    ".details-dropdown-container"
  );

  // Reset dropdowns to default state
  resetDetailsDropdown();

  // Reset legacy dropdown to default state
  const legacyDropdown = document.getElementById("profileDropdownMenu");
  const legacyButton = document.querySelector(".dropdown-button");

  if (legacyDropdown) {
    legacyDropdown.style.display = "none";
  }
  if (legacyButton) {
    legacyButton.classList.remove("open");
  }

  // Hide edit form
  container.style.display = "none";

  // Show dropdown containers (reset to default state)
  if (detailsDropdownContainer) {
    detailsDropdownContainer.style.display = "block";
  }
  if (legacyDropdownContainer) {
    legacyDropdownContainer.style.display = "block";
  }

  // Show back button
  if (backButton) {
    backButton.style.display = "flex";
  }

  // Reset legacy dropdown button text to default
  if (legacyDropdownButton) {
    legacyDropdownButton.textContent = "Select detail to update";
  }

  // Clear form
  document.getElementById("editFieldInput").value = "";
  document.getElementById("confirmPasswordInput").value = "";
  clearAllErrors();
}

// Reset details dropdown to default state
function resetDetailsDropdown() {
  const detailsDropdown = document.getElementById("detailsDropdownMenu");
  const detailsButton = document.querySelector(".details-dropdown-button");
  const detailsDropdownButton = document.getElementById(
    "detailsDropdownButtonText"
  );

  // Close dropdown
  if (detailsDropdown) {
    detailsDropdown.style.display = "none";
  }

  // Reset button state
  if (detailsButton) {
    detailsButton.classList.remove("open");
    detailsButton.setAttribute("aria-expanded", "false");
  }

  // Reset button text to default
  if (detailsDropdownButton) {
    detailsDropdownButton.textContent = "Select detail to update";
  }
}

// Get currently selected dropdown option based on button text
function getCurrentlySelectedOption() {
  const buttonText = document.getElementById("detailsDropdownButtonText");
  if (!buttonText) return null;

  const currentText = buttonText.textContent.trim();
  if (currentText === "Select detail to update") return null;

  return currentText;
}

// Focus the currently selected option or first option if none selected (only used for keyboard navigation)
function focusSelectedOrFirstOption() {
  const detailsMenuItems = document.querySelectorAll(".details-menu-item");
  const currentSelection = getCurrentlySelectedOption();

  if (currentSelection && detailsMenuItems.length > 0) {
    // Find the menu item that matches the current selection
    for (let item of detailsMenuItems) {
      const itemText = item.textContent.trim();
      if (itemText === currentSelection) {
        item.focus();
        return;
      }
    }
  }

  // If no match found or no current selection, focus first item
  if (detailsMenuItems.length > 0) {
    detailsMenuItems[0].focus();
  }
}

// Position dropdown safely to avoid header overlap
function positionDropdownSafely(dropdown, button) {
  const header = document.querySelector(".main-header");
  const profileSettingsSection = button.closest("section");

  if (!header || !profileSettingsSection) return;

  // Reset positioning and classes - always position dropdown below
  dropdown.style.top = "100%";
  dropdown.style.bottom = "auto";
  dropdown.classList.remove("dropdown-above", "behind-header");
  dropdown.style.zIndex = ""; // Reset inline z-index

  // Get dimensions and positions
  const headerRect = header.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const sectionRect = profileSettingsSection.getBoundingClientRect();

  // Calculate where dropdown would appear if positioned normally
  const dropdownHeight = dropdown.offsetHeight || 200; // Estimate if not rendered
  const dropdownTop = buttonRect.bottom + 4; // 4px margin
  const dropdownBottom = dropdownTop + dropdownHeight;

  // Check if button is in the upper portion of the section (likely to cause header overlap)
  const buttonDistanceFromSectionTop = buttonRect.top - sectionRect.top;
  const isButtonNearTop = buttonDistanceFromSectionTop < 150; // If button is within 150px of section top

  // Always position dropdown behind header if button is near top of section to avoid overlap
  if (isButtonNearTop) {
    // Force dropdown to go behind header but still below the button
    dropdown.classList.add("behind-header");
  }
  // Always use default positioning below the button with appropriate z-index
}

// Update visual selection when dropdown opens
function updateVisualSelection() {
  const detailsMenuItems = document.querySelectorAll(".details-menu-item");
  const currentSelection = getCurrentlySelectedOption();

  // Remove any existing selected classes
  detailsMenuItems.forEach((item) => item.classList.remove("selected"));

  if (currentSelection && detailsMenuItems.length > 0) {
    // Find and mark the currently selected item
    for (let item of detailsMenuItems) {
      const itemText = item.textContent.trim();
      if (itemText === currentSelection) {
        item.classList.add("selected");
        break;
      }
    }
  }
}

// Setup focus trap for modal dialogs
function setupModalFocusTrap(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  // Handle Tab key to trap focus within modal
  modal.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }

    // Handle Escape key to close modal
    if (e.key === "Escape") {
      const modalId = modal.id;
      if (modalId === "addStockModal") {
        hideAddStockModal();
      } else if (modalId === "addMutualFundModal") {
        hideAddMutualFundModal();
      } else if (modalId === "deleteAccountModal") {
        hideDeleteAccountModal();
      }
    }
  });

  // Handle clicks on modal backdrop to close modal
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      const modalId = modal.id;
      if (modalId === "addStockModal") {
        hideAddStockModal();
      } else if (modalId === "addMutualFundModal") {
        hideAddMutualFundModal();
      } else if (modalId === "deleteAccountModal") {
        hideDeleteAccountModal();
      }
    }
  });
}

// Freeze main window when modal is open
function freezeMainWindow() {
  const mainContent =
    document.querySelector("main") ||
    document.querySelector(".single-column-container") ||
    document.body;
  const header = document.querySelector(".main-header");

  // Prevent body scrolling and add modal-open class
  document.body.style.overflow = "hidden";
  document.body.classList.add("modal-open");

  // Make main content non-interactive and hidden from screen readers
  if (mainContent && mainContent !== document.body) {
    mainContent.setAttribute("aria-hidden", "true");
    mainContent.setAttribute("inert", "");
  }

  // Also make header non-interactive
  if (header) {
    header.setAttribute("aria-hidden", "true");
    header.setAttribute("inert", "");
  }
}

// Unfreeze main window when modal is closed
function unfreezeMainWindow() {
  const mainContent =
    document.querySelector("main") ||
    document.querySelector(".single-column-container") ||
    document.body;
  const header = document.querySelector(".main-header");

  // Restore body scrolling and remove modal-open class
  document.body.style.overflow = "";
  document.body.classList.remove("modal-open");

  // Make main content interactive and accessible to screen readers again
  if (mainContent && mainContent !== document.body) {
    mainContent.removeAttribute("aria-hidden");
    mainContent.removeAttribute("inert");
  }

  // Also make header interactive again
  if (header) {
    header.removeAttribute("aria-hidden");
    header.removeAttribute("inert");
  }
}

// Save field edit
async function saveFieldEdit() {
  const container = document.getElementById("editFieldContainer");
  const fieldType = container.getAttribute("data-field-type");
  const input = document.getElementById("editFieldInput");
  const value = input.value.trim();

  clearAllErrors();

  if (fieldType === "name") {
    await updateName(value);
  } else if (fieldType === "email") {
    await updateEmail(value);
  } else if (fieldType === "password") {
    const confirmInput = document.getElementById("confirmPasswordInput");
    const confirmValue = confirmInput.value;
    await updatePassword(value, confirmValue);
  }
}

// Update name function
async function updateName(newName) {
  if (!newName) {
    showError("editFieldError", "Name cannot be empty");
    return;
  }

  const currentSession = getCurrentSession();
  if (!currentSession) {
    showError("editFieldError", "User session not found");
    return;
  }

  // Get current user data
  const currentUserData = getUserData(currentSession.email);
  if (!currentUserData) {
    showError("editFieldError", "User data not found");
    return;
  }

  // Update user data
  const updatedUserData = {
    ...currentUserData,
    fullName: newName,
  };

  // Save updated data
  await setUserData(currentSession.email, updatedUserData);

  // Update current user session
  const updatedSessionData = {
    ...currentSession,
    name: newName,
  };
  await setCurrentSession(updatedSessionData);

  // Update header profile
  updateHeaderProfile();

  showSuccessNotification("Name updated successfully!");
  cancelFieldEdit();
}

// Update email function
async function updateEmail(newEmail) {
  if (!newEmail) {
    showError("editFieldError", "Email cannot be empty");
    return;
  }

  // Validate email format
  if (!isValidEmail(newEmail)) {
    showError("editFieldError", "Please enter a valid email address");
    return;
  }

  const currentSession = getCurrentSession();
  if (!currentSession) {
    showError("editFieldError", "User session not found");
    return;
  }

  const currentEmail = currentSession.email;

  // Check if new email already exists (if email is being changed)
  if (newEmail !== currentEmail) {
    const existingUser = getUserData(newEmail);
    if (existingUser) {
      showError("editFieldError", "Email already registered");
      return;
    }
  }

  // Get current user data
  const currentUserData = getUserData(currentEmail);
  if (!currentUserData) {
    showError("editFieldError", "User data not found");
    return;
  }

  // Update user data
  const updatedUserData = {
    ...currentUserData,
    email: newEmail,
  };

  // If email changed, remove old data and save with new key
  if (newEmail !== currentEmail) {
    await removeUserData(currentEmail); // Remove old email key
  }

  // Save updated data with new email key
  await setUserData(newEmail, updatedUserData);

  // Update current user session
  const updatedSessionData = {
    ...currentSession,
    email: newEmail,
  };
  await setCurrentSession(updatedSessionData);

  // Update header profile
  updateHeaderProfile();

  showSuccessNotification("Email updated successfully!");
  cancelFieldEdit();
}

// Update password function
async function updatePassword(newPassword, confirmPassword) {
  if (!newPassword) {
    showError("editFieldError", "Password cannot be empty");
    return;
  }

  if (newPassword.length < 6) {
    showError("editFieldError", "Password must be at least 6 characters");
    return;
  }

  if (!confirmPassword) {
    showError("confirmPasswordError", "Confirm password is required");
    return;
  }

  if (newPassword !== confirmPassword) {
    showError("confirmPasswordError", "Passwords do not match");
    return;
  }

  const currentSession = getCurrentSession();
  if (!currentSession) {
    showError("editFieldError", "User session not found");
    return;
  }

  // Get current user data
  const currentUserData = getUserData(currentSession.email);
  if (!currentUserData) {
    showError("editFieldError", "User data not found");
    return;
  }

  // Update user data
  const updatedUserData = {
    ...currentUserData,
    password: newPassword,
  };

  // Save updated data
  await setUserData(currentSession.email, updatedUserData);

  showSuccessNotification("Password updated successfully!");
  cancelFieldEdit();
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("profileDropdownMenu");
  const button = document.querySelector(".dropdown-button");
  const container = document.querySelector(".dropdown-container");

  if (container && !container.contains(event.target)) {
    if (dropdown) {
      dropdown.style.display = "none";
    }
    if (button) {
      button.classList.remove("open");
    }
  }
});

// Logout function
async function logout() {
  try {
    // Call secure logout endpoint
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: 'include'
    });

    if (response.ok) {
      console.log("✅ Logout successful");
    } else {
      console.log("⚠️ Logout response not ok, but clearing session anyway");
    }
  } catch (error) {
    console.error("Logout error:", error);
    // Continue with logout even if server request fails
  }

  // Clear client-side state
  currentUser = null;
  userData = { users: {}, sessions: {}, appSettings: {} };

  // Redirect to login page
  window.location.href = "login.html";
}

// Update header profile visibility and info
function updateHeaderProfile() {
  const currentSession = getCurrentSession();
  const profileIcon = document.querySelector(".profile-icon");

  if (!profileIcon) {
    return;
  }

  if (currentSession) {
    profileIcon.classList.add("show");

    // Update profile info in dropdown
    const profileName = document.querySelector(".profile-name");
    const profileEmail = document.querySelector(".profile-email");

    if (profileName) {
      profileName.textContent = currentSession.name;
    }
    if (profileEmail) {
      profileEmail.textContent = currentSession.email;
    }
  } else {
    profileIcon.classList.remove("show");
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const headerProfile = document.querySelector(".header-profile");
  const dropdown = document.querySelector(".dropdown");

  if (headerProfile && dropdown && !headerProfile.contains(event.target)) {
    dropdown.style.display = "none";
  }
});

// Initialize application on page load
document.addEventListener("DOMContentLoaded", async function () {
  // Load user data from JSON file
  await loadUserData();

  // Check authentication status and update UI
  checkAuthStatus();

  // Ensure header profile is updated after data load with a small delay for DOM readiness
  setTimeout(() => {
    updateHeaderProfile();
  }, 50);

  // Initialize time period buttons
  initializeTimeButtons();

  // Add keyboard event handler for logo
  initializeLogoKeyboardHandler();

  // Add input event listeners to hide errors on typing
  setupInputErrorHandling();

  // Setup keyboard navigation and form submission
  setupKeyboardNavigation();

  // Setup placeholder content management
  setupPlaceholderContentManagement();

  // Initialize action buttons
  initializeActionButtons();

  // Initialize dashboard interactions
  initializeDashboardInteractions();

  // Fix autocomplete color issues
  fixAutocompleteColors();
});

// Initialize logo keyboard event handler
function initializeLogoKeyboardHandler() {
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.addEventListener("keydown", function (e) {
      // Handle Enter and Space key presses
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault(); // Prevent default space scrolling behavior

        // Add visual feedback for keyboard activation
        logo.classList.add("active");

        // Remove the visual feedback after a short delay
        setTimeout(() => {
          logo.classList.remove("active");
        }, 150);

        // Trigger the home page function
        goToHomePage();
      }
    });
  }
}

// Initialize time period buttons
function initializeTimeButtons() {
  const timeButtons = document.querySelectorAll(".time-btn");

  timeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      timeButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      this.classList.add("active");

      // Update chart based on selected time period
      updateChartData(this.textContent);
    });
  });
}

// Update chart data based on time period
function updateChartData(period) {
  // Generate different data based on time period
  let dataPoints;

  switch (period) {
    case "1W":
      dataPoints = generateWeeklyData();
      break;
    case "1M":
      dataPoints = generateMonthlyData();
      break;
    case "3M":
      dataPoints = generateQuarterlyData();
      break;
    case "1Y":
      dataPoints = generateYearlyData();
      break;
    case "ALL":
      dataPoints = generateAllTimeData();
      break;
    default:
      dataPoints = generateWeeklyData();
  }

  drawChart(dataPoints);
}

// Data generation functions
function generateWeeklyData() {
  return [
    { x: 50, y: 200 },
    { x: 100, y: 180 },
    { x: 150, y: 160 },
    { x: 200, y: 140 },
    { x: 250, y: 120 },
    { x: 300, y: 100 },
    { x: 350, y: 80 },
  ];
}

function generateMonthlyData() {
  return [
    { x: 40, y: 220 },
    { x: 80, y: 200 },
    { x: 120, y: 180 },
    { x: 160, y: 160 },
    { x: 200, y: 140 },
    { x: 240, y: 120 },
    { x: 280, y: 100 },
    { x: 320, y: 80 },
    { x: 360, y: 60 },
  ];
}

function generateQuarterlyData() {
  return [
    { x: 30, y: 250 },
    { x: 70, y: 230 },
    { x: 110, y: 210 },
    { x: 150, y: 190 },
    { x: 190, y: 170 },
    { x: 230, y: 150 },
    { x: 270, y: 130 },
    { x: 310, y: 110 },
    { x: 350, y: 90 },
    { x: 390, y: 70 },
  ];
}

function generateYearlyData() {
  return [
    { x: 25, y: 280 },
    { x: 60, y: 260 },
    { x: 95, y: 240 },
    { x: 130, y: 220 },
    { x: 165, y: 200 },
    { x: 200, y: 180 },
    { x: 235, y: 160 },
    { x: 270, y: 140 },
    { x: 305, y: 120 },
    { x: 340, y: 100 },
    { x: 375, y: 80 },
    { x: 410, y: 60 },
  ];
}

function generateAllTimeData() {
  return [
    { x: 20, y: 300 },
    { x: 50, y: 280 },
    { x: 80, y: 260 },
    { x: 110, y: 240 },
    { x: 140, y: 220 },
    { x: 170, y: 200 },
    { x: 200, y: 180 },
    { x: 230, y: 160 },
    { x: 260, y: 140 },
    { x: 290, y: 120 },
    { x: 320, y: 100 },
    { x: 350, y: 80 },
    { x: 380, y: 60 },
    { x: 410, y: 40 },
  ];
}

// Initialize action buttons
function initializeActionButtons() {
  const actionButtons = document.querySelectorAll(".action-btn");

  actionButtons.forEach((button, index) => {
    button.addEventListener("click", function () {
      // Add click effect
      this.style.transform = "translateY(-2px) scale(0.98)";
      setTimeout(() => {
        this.style.transform = "translateY(-2px)";
      }, 150);

      // Handle different actions based on button text
      const buttonText = this.textContent.trim();
      console.log(`${buttonText} section accessed`);

      // Simulate different actions
      switch (buttonText) {
        case "Portfolio":
          showNotification("Portfolio section loading...", "info");
          break;
        case "Analytics":
          showNotification("Analytics dashboard opening...", "info");
          break;
        case "Settings":
          showNotification("Settings panel ready...", "info");
          break;
      }
    });
  });
}

// Initialize dashboard interactions
function initializeDashboardInteractions() {
  // Make data cards interactive
  const dataCards = document.querySelectorAll(".data-card");
  dataCards.forEach((card) => {
    card.addEventListener("click", function () {
      this.style.transform = "translateY(-5px) scale(1.02)";
      setTimeout(() => {
        this.style.transform = "translateY(-5px)";
      }, 150);

      const cardTitle = this.querySelector("h3").textContent;
      showNotification(`${cardTitle} details expanded`, "success");
    });
  });

  // Make transaction items interactive
  const transactionItems = document.querySelectorAll(".transaction-item");
  transactionItems.forEach((item) => {
    item.addEventListener("click", function () {
      const stock = this.querySelector(".stock").textContent;
      const action = this.querySelector(".action").textContent;
      const amount = this.querySelector(".amount").textContent;
      showNotification(`Transaction: ${action} ${stock} for ${amount}`, "info");
    });
  });

  // Make holding items interactive
  const holdingItems = document.querySelectorAll(".holding-item");
  holdingItems.forEach((item) => {
    item.addEventListener("click", function () {
      const symbol = this.querySelector(".symbol").textContent;
      const percentage = this.querySelector(".percentage").textContent;
      showNotification(
        `${symbol} represents ${percentage} of your portfolio`,
        "info"
      );
    });
  });
}

// Notification system
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    max-width: 300px;
    font-size: 14px;
  `;

  // Set background color based on type
  const colors = {
    info: "#007bff",
    success: "#28a745",
    warning: "#ffc107",
    error: "#dc3545",
  };
  notification.style.backgroundColor = colors[type] || colors.info;

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateX(0)";
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Fix autocomplete color jerk issues
function fixAutocompleteColors() {
  const inputFields = document.querySelectorAll(".input-field");

  inputFields.forEach((input) => {
    // Force style reset on input event
    input.addEventListener("input", function () {
      // Small delay to override browser autocomplete styling
      setTimeout(() => {
        const computedStyle = getComputedStyle(document.documentElement);
        const inputBg = computedStyle.getPropertyValue("--input-bg").trim();
        const textColor = computedStyle.getPropertyValue("--text-color").trim();

        this.style.backgroundColor = inputBg + " !important";
        this.style.color = textColor + " !important";
      }, 10);
    });

    // Handle autocomplete selection
    input.addEventListener("change", function () {
      setTimeout(() => {
        const computedStyle = getComputedStyle(document.documentElement);
        const inputBg = computedStyle.getPropertyValue("--input-bg").trim();
        const textColor = computedStyle.getPropertyValue("--text-color").trim();

        this.style.setProperty("background-color", inputBg, "important");
        this.style.setProperty("color", textColor, "important");
        this.style.setProperty(
          "-webkit-text-fill-color",
          textColor,
          "important"
        );
      }, 10);
    });

    // Handle focus events
    input.addEventListener("focus", function () {
      const computedStyle = getComputedStyle(document.documentElement);
      const inputBg = computedStyle.getPropertyValue("--input-bg").trim();
      const textColor = computedStyle.getPropertyValue("--text-color").trim();

      // Immediate application
      this.style.setProperty("background-color", inputBg, "important");
      this.style.setProperty("color", textColor, "important");
      this.style.setProperty("-webkit-text-fill-color", textColor, "important");
      this.style.setProperty("background", inputBg, "important");

      // Additional timeout to override any delayed browser styling
      setTimeout(() => {
        this.style.setProperty("background-color", inputBg, "important");
        this.style.setProperty("color", textColor, "important");
        this.style.setProperty(
          "-webkit-text-fill-color",
          textColor,
          "important"
        );
        this.style.setProperty("background", inputBg, "important");
      }, 0);

      setTimeout(() => {
        this.style.setProperty("background-color", inputBg, "important");
        this.style.setProperty("color", textColor, "important");
        this.style.setProperty(
          "-webkit-text-fill-color",
          textColor,
          "important"
        );
        this.style.setProperty("background", inputBg, "important");
      }, 10);
    });

    // Handle click events specifically
    input.addEventListener("click", function () {
      const computedStyle = getComputedStyle(document.documentElement);
      const inputBg = computedStyle.getPropertyValue("--input-bg").trim();
      const textColor = computedStyle.getPropertyValue("--text-color").trim();

      this.style.setProperty("background-color", inputBg, "important");
      this.style.setProperty("color", textColor, "important");
      this.style.setProperty("-webkit-text-fill-color", textColor, "important");
      this.style.setProperty("background", inputBg, "important");
    });
  });

  // Watch for changes and update autocomplete colors
  const observer = new MutationObserver(() => {
    setTimeout(() => {
      inputFields.forEach((input) => {
        if (input.matches(":-webkit-autofill")) {
          const computedStyle = getComputedStyle(document.documentElement);
          const inputBg = computedStyle.getPropertyValue("--input-bg").trim();
          const textColor = computedStyle
            .getPropertyValue("--text-color")
            .trim();

          input.style.setProperty("background-color", inputBg, "important");
          input.style.setProperty("color", textColor, "important");
          input.style.setProperty(
            "-webkit-text-fill-color",
            textColor,
            "important"
          );
        }
      });
    }, 10);
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

// Authentication Functions
async function handleLogin() {
  // Get login button and set loading state
  const loginBtn = document.querySelector(".login-btn");
  setButtonLoading(loginBtn, "Logging in...");

  try {
    // Clear previous errors
    clearAllErrors();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    let hasErrors = false;

    // Validate email
    if (!email.trim()) {
      showError("loginEmailError", "Email is required");
      hasErrors = true;
    } else if (!isValidEmail(email.trim())) {
      showError("loginEmailError", "Please enter a valid email address");
      hasErrors = true;
    }

    // Validate password
    if (!password.trim()) {
      showError("loginPasswordError", "Password is required");
      hasErrors = true;
    }

    if (hasErrors) {
      removeButtonLoading(loginBtn);
      return;
    }

    // Send login request to secure server
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const result = await response.json();

    if (response.ok) {
      // Login successful
      currentUser = result.user;
      showNotification("Login successful! Welcome back.", "success");
      
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } else {
      // Login failed
      if (result.error === "Invalid credentials") {
        showError("loginPasswordError", "Invalid email or password");
      } else {
        showError("loginEmailError", result.error || "Login failed");
      }
    }

    // Reset button state
    removeButtonLoading(loginBtn);

  } catch (error) {
    console.error("Login error:", error);
    showError("loginEmailError", "Network error. Please check your connection.");
    removeButtonLoading(loginBtn);
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function handleSignup() {
  // Get signup button and set loading state
  const signupBtn = document.querySelector(".signup-btn");
  setButtonLoading(signupBtn, "Creating Account...");

  try {
    // Clear previous errors
    clearAllErrors();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    let hasErrors = false;

    // Validate full name
    if (!fullName.trim()) {
      showError("fullNameError", "Full name is required");
      hasErrors = true;
    } else if (fullName.trim().length < 2) {
      showError("fullNameError", "Full name must be at least 2 characters");
      hasErrors = true;
    }

    // Validate email
    if (!email.trim()) {
      showError("signupEmailError", "Email is required");
      hasErrors = true;
    } else if (!isValidEmail(email.trim())) {
      showError("signupEmailError", "Please enter a valid email address");
      hasErrors = true;
    }

    // Validate password
    if (!password.trim()) {
      showError("signupPasswordError", "Password is required");
      hasErrors = true;
    } else if (password.length < 8) {
      showError(
        "signupPasswordError",
        "Password must be at least 8 characters long"
      );
      hasErrors = true;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      showError("confirmPasswordError", "Please confirm your password");
      hasErrors = true;
    } else if (password !== confirmPassword) {
      showError("confirmPasswordError", "Passwords do not match");
      hasErrors = true;
    }

    if (hasErrors) {
      removeButtonLoading(signupBtn);
      return;
    }

    // Send registration request to secure server
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ 
        name: fullName.trim(), 
        email: email.trim(), 
        password 
      }),
    });

    const result = await response.json();

    if (response.ok) {
      // Registration successful
      currentUser = result.user;
      showNotification("Account created successfully! Welcome!", "success");
      
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } else {
      // Registration failed
      if (result.error === "User already exists") {
        showError("signupEmailError", "Email already registered");
      } else {
        showError("signupEmailError", result.error || "Registration failed");
      }
    }

    // Reset button state
    removeButtonLoading(signupBtn);

  } catch (error) {
    console.error("Signup error:", error);
    showError("signupEmailError", "Network error. Please check your connection.");
    removeButtonLoading(signupBtn);
  }
}

async function showLogin() {
  // Clear all error messages and input values when switching to login page
  clearAllErrorsAndInputs();

  // Update session if user is logged in, otherwise don't create a session
  const currentSession = getCurrentSession();
  if (currentSession) {
    await setCurrentSession({
      ...currentSession,
      currentPage: "login",
    });
  }

  // Redirect to login page
  window.location.href = "login.html";
}

async function showSignup() {
  // Clear all error messages and input values when switching to signup page
  clearAllErrorsAndInputs();

  // Update session if user is logged in, otherwise don't create a session
  const currentSession = getCurrentSession();
  if (currentSession) {
    await setCurrentSession({
      ...currentSession,
      currentPage: "signup",
    });
  }

  // Redirect to signup page
  window.location.href = "signup.html";
}

async function showDashboard(username) {
  // Update current session with dashboard page
  const currentSession = getCurrentSession();
  if (currentSession) {
    await setCurrentSession({
      ...currentSession,
      currentPage: "dashboard",
    });
  }

  // Redirect to dashboard page
  window.location.href = "dashboard.html";
}

function clearLoginFields() {
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  clearAllErrors();
}

function clearSignupFields() {
  document.getElementById("fullName").value = "";
  document.getElementById("signupEmail").value = "";
  document.getElementById("signupPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  clearAllErrors();
}

// Check if user is already logged in on page load
function checkAuthStatus() {
  // Initial state is now handled by inline script in HTML to prevent flash
  // This function can be used for additional setup if needed
  const currentSession = getCurrentSession();

  // Update header profile visibility
  updateHeaderProfile();

  if (currentSession && userData.sessions.isLoggedIn) {
    // Initialize chart if on dashboard
    setTimeout(() => {
      const canvas = document.getElementById("investmentChart");
      if (
        canvas &&
        document.getElementById("dashboardContent").style.display !== "none"
      ) {
        drawChart();
      }
    }, 100);
  }
}

// Go to home page function - acts as a complete website refresher
async function goToHomePage() {
  // Reset all form states and clear any active editing
  resetToDefaultState();

  const currentSession = getCurrentSession();

  if (currentSession && userData.sessions.isLoggedIn) {
    // If user is logged in, show dashboard
    await showDashboard(currentSession.email);
  } else {
    // If user is not logged in, show login page
    await showLogin();
  }
}

// Reset everything to default state
function resetToDefaultState() {
  // Clear all errors
  clearAllErrors();

  // Reset profile settings dropdown
  const dropdown = document.getElementById("profileDropdownMenu");
  const dropdownButton = document.querySelector(".dropdown-button");
  const dropdownButtonText = document.getElementById("dropdownButtonText");
  const dropdownContainer = document.querySelector(".dropdown-container");

  if (dropdown) {
    dropdown.style.display = "none";
  }
  if (dropdownButton) {
    dropdownButton.classList.remove("open");
  }
  if (dropdownButtonText) {
    dropdownButtonText.textContent = "Select detail to update";
  }
  if (dropdownContainer) {
    dropdownContainer.style.display = "block";
  }

  // Hide edit field container
  const editContainer = document.getElementById("editFieldContainer");
  if (editContainer) {
    editContainer.style.display = "none";
  }

  // Show back to dashboard button if it exists
  const backButton = document.querySelector(".profile-settings-buttons");
  if (backButton) {
    backButton.style.display = "flex";
  }

  // Clear all input fields
  const editFieldInput = document.getElementById("editFieldInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  if (editFieldInput) {
    editFieldInput.value = "";
  }
  if (confirmPasswordInput) {
    confirmPasswordInput.value = "";
  }

  // Reset any form inputs in login/signup
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (loginForm) {
    loginForm.reset();
  }
  if (signupForm) {
    signupForm.reset();
  }

  // Remove focus from any active elements
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}

// Chart Drawing Function
function drawChart(customDataPoints = null) {
  const canvas = document.getElementById("investmentChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Set canvas size for retina displays
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  ctx.scale(2, 2);

  // Use custom data points or default
  const dataPoints = customDataPoints || generateWeeklyData();

  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Scale data points to fit canvas
  const maxX = Math.max(...dataPoints.map((p) => p.x));
  const maxY = Math.max(...dataPoints.map((p) => p.y));
  const minY = Math.min(...dataPoints.map((p) => p.y));

  const scaledPoints = dataPoints.map((point) => ({
    x: (point.x / maxX) * (rect.width - 60) + 30,
    y:
      rect.height -
      30 -
      ((point.y - minY) / (maxY - minY)) * (rect.height - 60),
  }));

  // Draw grid lines
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--input-border")
    .trim();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;

  // Vertical grid lines
  for (let i = 1; i < 5; i++) {
    const x = (rect.width / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, rect.height - 20);
    ctx.stroke();
  }

  // Horizontal grid lines
  for (let i = 1; i < 4; i++) {
    const y = (rect.height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(rect.width - 20, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  // Draw gradient fill under the line
  const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
  gradient.addColorStop(0, "rgba(0, 123, 255, 0.2)");
  gradient.addColorStop(1, "rgba(0, 123, 255, 0.05)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);

  for (let i = 1; i < scaledPoints.length; i++) {
    ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
  }

  ctx.lineTo(scaledPoints[scaledPoints.length - 1].x, rect.height - 20);
  ctx.lineTo(scaledPoints[0].x, rect.height - 20);
  ctx.closePath();
  ctx.fill();

  // Draw the main line
  ctx.strokeStyle = "#007bff";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);

  for (let i = 1; i < scaledPoints.length; i++) {
    ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
  }

  ctx.stroke();

  // Draw data points with hover effect
  ctx.fillStyle = "#007bff";
  scaledPoints.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Add a white border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// Handle window resize
window.addEventListener("resize", function () {
  setTimeout(() => drawChart(), 100);
});

// Add smooth scrolling for better UX
document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", function (e) {
    // Add ripple effect
    const ripple = document.createElement("span");
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            animation: ripple 0.6s ease-out;
        `;

    this.style.position = "relative";
    this.style.overflow = "hidden";
    this.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// Add CSS for ripple animation
const style = document.createElement("style");
style.textContent = `
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Notification System
function showNotification(message, type = "success", duration = 4000) {
  const container = document.getElementById("notificationContainer");
  if (!container) return;

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Create icon based on type
  const iconSVG =
    type === "success"
      ? `<svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <polyline points="20,6 9,17 4,12"></polyline>
       </svg>`
      : `<svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="10"></circle>
         <line x1="15" y1="9" x2="9" y2="15"></line>
         <line x1="9" y1="9" x2="15" y2="15"></line>
       </svg>`;

  // Create close button
  const closeButton = `
    <button class="notification-close" onclick="hideNotification(this.parentElement)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  notification.innerHTML = `
    ${iconSVG}
    <span>${message}</span>
    ${closeButton}
  `;

  // Add to container
  container.appendChild(notification);

  // Show notification with animation
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  // Auto-hide after duration
  setTimeout(() => {
    hideNotification(notification);
  }, duration);

  return notification;
}

function hideNotification(notification) {
  if (!notification || !notification.classList.contains("show")) return;

  notification.classList.remove("show");

  // Remove from DOM after animation
  setTimeout(() => {
    if (notification.parentElement) {
      notification.parentElement.removeChild(notification);
    }
  }, 300);
}

function showSuccessNotification(message) {
  return showNotification(message, "success");
}

function showErrorNotification(message) {
  return showNotification(message, "error");
}

// Initialize application on page load
async function initializeApp() {
  // Load user data first
  await loadUserData();

  // Check if user is logged in
  const currentSession = getCurrentSession();

  if (currentSession && currentSession.email) {
    // User is logged in - show dashboard/portfolio
    showPage("dashboard");
    updateHeaderProfile();
    loadUserPortfolio(currentSession.email);
  } else {
    // User is not logged in - show login page
    showPage("login");
  }

  // Setup additional functionality
  setupInputErrorHandling();
  setupKeyboardNavigation();
}

// Load user portfolio data
function loadUserPortfolio(userEmail) {
  const user = getUserData(userEmail);
  if (!user) return;

  // Initialize portfolio data if it doesn't exist
  if (!user.portfolio) {
    user.portfolio = {
      value: 0,
      dailyChange: 0,
      totalGain: 0,
      transactions: [],
      holdings: [],
      stocks: [],
      mutualFunds: [],
    };
  }

  // Update portfolio summary
  const portfolioValueEl = document.getElementById("portfolioValue");
  const dailyChangeEl = document.getElementById("dailyChange");
  const totalGainEl = document.getElementById("totalGain");

  if (portfolioValueEl) {
    portfolioValueEl.textContent = `$${user.portfolio.value.toFixed(2)}`;
  }
  if (dailyChangeEl) {
    dailyChangeEl.textContent = `$${user.portfolio.dailyChange.toFixed(2)}`;
    dailyChangeEl.className =
      user.portfolio.dailyChange >= 0 ? "value positive" : "value negative";
  }
  if (totalGainEl) {
    totalGainEl.textContent = `${user.portfolio.totalGain.toFixed(1)}%`;
    totalGainEl.className =
      user.portfolio.totalGain >= 0 ? "value positive" : "value negative";
  }

  // Update transactions
  loadTransactions(user.portfolio.transactions);

  // Update holdings
  loadHoldings(user.portfolio.holdings);

  // Load stocks and mutual funds tables
  loadStocksTable(user.portfolio.stocks || []);
  loadMutualFundsTable(user.portfolio.mutualFunds || []);
}

// Load transactions into the UI
function loadTransactions(transactions) {
  const transactionList = document.getElementById("transactionList");

  if (!transactions || transactions.length === 0) {
    transactionList.innerHTML =
      '<div class="no-data">No transactions yet</div>';
    return;
  }

  transactionList.innerHTML = transactions
    .map(
      (transaction) => `
    <div class="transaction-item">
      <span class="stock">${transaction.symbol}</span>
      <span class="action ${transaction.type.toLowerCase()}">${
        transaction.type
      }</span>
      <span class="amount">$${transaction.amount.toFixed(2)}</span>
    </div>
  `
    )
    .join("");
}

// Load holdings into the UI
function loadHoldings(holdings) {
  const holdingsList = document.getElementById("holdingsList");

  if (!holdings || holdings.length === 0) {
    holdingsList.innerHTML = '<div class="no-data">No holdings yet</div>';
    return;
  }

  holdingsList.innerHTML = holdings
    .map(
      (holding) => `
    <div class="holding-item">
      <span class="symbol">${holding.symbol}</span>
      <span class="percentage">${holding.percentage.toFixed(1)}%</span>
    </div>
  `
    )
    .join("");
}

// Holdings Management Functions

// Load stocks table with grid layout
function loadStocksTable(stocks) {
  const tableBody = document.getElementById("stocksTableBody");

  if (!stocks || stocks.length === 0) {
    tableBody.innerHTML = `
      <div class="no-holdings">
        <p>No stocks in portfolio</p>
      </div>
    `;
    return;
  }

  tableBody.innerHTML = stocks
    .map((stock, index) => {
      const investment = stock.quantity * stock.avgPrice;
      const currentValue = stock.quantity * stock.currentPrice;
      const gainLoss = currentValue - investment;
      const returnPercent = investment > 0 ? (gainLoss / investment) * 100 : 0;
      const gainLossClass = gainLoss >= 0 ? "positive" : "negative";

      return `
        <div class="holding-row">
          <div class="holding-col">
            <div class="symbol-info">
              <span class="symbol">${stock.symbol}</span>
            </div>
          </div>
          <div class="holding-col">
            <span class="company-name">${stock.company || stock.symbol}</span>
          </div>
          <div class="holding-col">${stock.quantity}</div>
          <div class="holding-col">₹${stock.avgPrice.toFixed(2)}</div>
          <div class="holding-col">₹${stock.currentPrice.toFixed(2)}</div>
          <div class="holding-col">₹${investment.toFixed(2)}</div>
          <div class="holding-col">₹${currentValue.toFixed(2)}</div>
          <div class="holding-col">
            <span class="${gainLossClass}">₹${gainLoss.toFixed(2)}</span>
          </div>
          <div class="holding-col">
            <span class="${gainLossClass}">${returnPercent.toFixed(2)}%</span>
          </div>
          <div class="holding-col">
            <div class="actions">
              <button class="portfolio-action-btn edit-btn" onclick="editStock(${index})" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="portfolio-action-btn delete-btn" onclick="deleteStock(${index})" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

// Load mutual funds table with grid layout
function loadMutualFundsTable(mutualFunds) {
  const tableBody = document.getElementById("mutualFundsTableBody");

  if (!mutualFunds || mutualFunds.length === 0) {
    tableBody.innerHTML = `
      <div class="no-holdings">
        <p>No mutual funds in portfolio</p>
      </div>
    `;
    return;
  }

  tableBody.innerHTML = mutualFunds
    .map((fund, index) => {
      const investment = fund.units * fund.avgNAV;
      const currentValue = fund.units * fund.currentNAV;
      const gainLoss = currentValue - investment;
      const returnPercent = investment > 0 ? (gainLoss / investment) * 100 : 0;
      const gainLossClass = gainLoss >= 0 ? "positive" : "negative";

      return `
        <div class="holding-row">
          <div class="holding-col">
            <span class="symbol">${fund.scheme}</span>
          </div>
          <div class="holding-col">
            <span class="company-name">${fund.fundName}</span>
          </div>
          <div class="holding-col">${fund.units.toFixed(3)}</div>
          <div class="holding-col">₹${fund.avgNAV.toFixed(2)}</div>
          <div class="holding-col">₹${fund.currentNAV.toFixed(2)}</div>
          <div class="holding-col">₹${investment.toFixed(2)}</div>
          <div class="holding-col">₹${currentValue.toFixed(2)}</div>
          <div class="holding-col">
            <span class="${gainLossClass}">₹${gainLoss.toFixed(2)}</span>
          </div>
          <div class="holding-col">
            <span class="${gainLossClass}">${returnPercent.toFixed(2)}%</span>
          </div>
          <div class="holding-col">
            <div class="actions">
              <button class="portfolio-action-btn edit-btn" onclick="editMutualFund(${index})" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="portfolio-action-btn delete-btn" onclick="deleteMutualFund(${index})" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

// Modal functions for adding investments
let modalTriggerElement = null; // Store the element that opened the modal

function showAddStockModal() {
  // Store the element that triggered the modal for focus restoration
  modalTriggerElement = document.activeElement;

  // Create and show modal with enhanced design
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "addStockModal";
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-labelledby="stockModalTitle" aria-modal="true">
      <div class="modal-header">
        <h3 id="stockModalTitle">Add Stock</h3>
        <span class="close" onclick="hideAddStockModal()" aria-label="Close modal" tabindex="0" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); hideAddStockModal(); }">&times;</span>
      </div>
      <div class="modal-body">
        <form id="stockForm" onsubmit="addStock(event)" novalidate>
          <div class="form-group">
            <label for="stockExchange">Exchange</label>
            <div class="stock-exchange-dropdown-container">
              <button type="button" class="stock-exchange-dropdown-button" onclick="toggleStockExchangeDropdown()" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false">
                <span id="stockExchangeButtonText">Select Stock Exchange</span>
                <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              <div class="stock-exchange-dropdown" id="stockExchangeDropdownMenu" style="display: none">
                <div class="stock-exchange-menu-item" onclick="selectStockExchangeOption('NSE')" tabindex="-1" role="option">
                  NSE
                </div>
                <div class="stock-exchange-menu-item" onclick="selectStockExchangeOption('BSE')" tabindex="-1" role="option">
                  BSE
                </div>
              </div>
            </div>
            <input type="hidden" id="stockExchange" name="stockExchange" required>
            <div class="error-message" id="stockExchangeError"></div>
          </div>
          
          <div class="form-group">
            <label for="stockSymbol">Stock Symbol</label>
            <input type="text" id="stockSymbol" required placeholder="Search for stocks..." class="input-field">
            <div class="error-message" id="stockSymbolError"></div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="stockQuantity">Quantity</label>
              <input type="number" id="stockQuantity" required min="1" placeholder="0" class="input-field">
              <div class="error-message" id="stockQuantityError"></div>
            </div>
            <div class="form-group">
              <label for="stockPurchasePrice">Purchase Price</label>
              <input type="number" id="stockPurchasePrice" required min="0" step="0.01" placeholder="0.00" class="input-field">
              <div class="error-message" id="stockPurchasePriceError"></div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="stockPurchaseDate">Purchase Date</label>
            <input type="date" id="stockPurchaseDate" required class="input-field" placeholder="DD-MM-YYYY">
            <div class="error-message" id="stockPurchaseDateError"></div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary submit-btn">Add Stock</button>
            <button type="button" class="btn-secondary" onclick="hideAddStockModal()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = "block";

  // Freeze the main window
  freezeMainWindow();

  // Setup input error handling for stock modal
  setupStockModalErrorHandling();

  // Setup keyboard accessibility for stock exchange dropdown
  setupStockExchangeDropdownAccessibility();

  // Set focus to the modal and first focusable element
  setTimeout(() => {
    const modalContent = modal.querySelector(".modal-content");

    // Set modal as focus trap and focus on modal content
    modalContent.setAttribute("tabindex", "-1");
    modalContent.focus();

    // Don't automatically focus on dropdown button - let user navigate manually
    // All keyboard and mouse functionality remains intact

    // Setup modal focus trap
    setupModalFocusTrap(modal);
  }, 100);
}

// Setup input event listeners for stock modal to hide errors on interaction
function setupStockModalErrorHandling() {
  const stockModalInputMappings = [
    { inputId: "stockSymbol", errorId: "stockSymbolError" },
    { inputId: "stockQuantity", errorId: "stockQuantityError" },
    { inputId: "stockPurchasePrice", errorId: "stockPurchasePriceError" },
    { inputId: "stockPurchaseDate", errorId: "stockPurchaseDateError" },
  ];

  stockModalInputMappings.forEach((mapping) => {
    const inputElement = document.getElementById(mapping.inputId);
    if (inputElement) {
      // Hide error on input (typing)
      inputElement.addEventListener("input", function () {
        hideStockModalError(mapping.errorId);
      });

      // Hide error on blur (focus change) if field has content
      inputElement.addEventListener("blur", function () {
        if (this.value.trim()) {
          hideStockModalError(mapping.errorId);
        }
      });
    }
  });

  // Special handling for stock exchange dropdown
  const stockExchangeButton = document.querySelector(
    ".stock-exchange-dropdown-button"
  );
  if (stockExchangeButton) {
    stockExchangeButton.addEventListener("click", function () {
      hideStockModalError("stockExchangeError");
    });
  }
}

// Show error in stock modal
function showStockModalError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }
}

// Hide error in stock modal
function hideStockModalError(errorId) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = "";
    errorElement.classList.remove("show");
  }
}

// Clear all errors in stock modal
function clearAllStockModalErrors() {
  const stockModalErrors = [
    "stockExchangeError",
    "stockSymbolError",
    "stockQuantityError",
    "stockPurchasePriceError",
    "stockPurchaseDateError",
  ];
  stockModalErrors.forEach((errorId) => {
    hideStockModalError(errorId);
  });
}

// Mutual Fund Modal Error Handling Functions
function setupMutualFundModalErrorHandling() {
  const fundModalInputs = [
    { id: "fundScheme", errorId: "fundSchemeError" },
    { id: "fundUnits", errorId: "fundUnitsError" },
    { id: "fundPurchaseNAV", errorId: "fundPurchaseNAVError" },
    { id: "fundInvestmentAmount", errorId: "fundInvestmentAmountError" },
    { id: "fundPurchaseDate", errorId: "fundPurchaseDateError" },
  ];

  fundModalInputs.forEach(({ id, errorId }) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", () => hideMutualFundModalError(errorId));
      input.addEventListener("blur", () => hideMutualFundModalError(errorId));
    }
  });
}

// Show error in mutual fund modal
function showMutualFundModalError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }
}

// Hide error in mutual fund modal
function hideMutualFundModalError(errorId) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = "";
    errorElement.classList.remove("show");
  }
}

// Clear all mutual fund modal errors
function clearAllMutualFundModalErrors() {
  const mutualFundModalErrors = [
    "fundSchemeError",
    "fundUnitsError",
    "fundPurchaseNAVError",
    "fundInvestmentAmountError",
    "fundPurchaseDateError",
  ];
  mutualFundModalErrors.forEach((errorId) => {
    hideMutualFundModalError(errorId);
  });
}

function hideAddStockModal() {
  const modal = document.getElementById("addStockModal");
  if (modal) {
    // Reset all button states in the modal before removing
    resetAllButtonStates(modal);

    modal.remove();

    // Unfreeze the main window
    unfreezeMainWindow();

    // Restore focus to the element that opened the modal, then blur after a short delay
    if (modalTriggerElement) {
      modalTriggerElement.focus();

      // Remove focus outline after a short delay to prevent persistent focus styles
      setTimeout(() => {
        resetButtonState(modalTriggerElement);
        modalTriggerElement = null;
      }, 100);
    }
  }
}

function showAddMutualFundModal() {
  // Store the element that triggered the modal for focus restoration
  modalTriggerElement = document.activeElement;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "addMutualFundModal";
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-labelledby="mutualFundModalTitle" aria-modal="true">
      <div class="modal-header">
        <h3 id="mutualFundModalTitle">Add Mutual Fund</h3>
        <span class="close" onclick="hideAddMutualFundModal()" aria-label="Close modal" tabindex="0" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); hideAddMutualFundModal(); }">&times;</span>
      </div>
      <div class="modal-body">
        <form id="mutualFundForm" onsubmit="addMutualFund(event)" novalidate>
          <div class="form-group">
            <label for="fundScheme">Mutual Fund Scheme</label>
            <input type="text" id="fundScheme" required placeholder="Search for mutual funds..." class="input-field">
            <div class="error-message" id="fundSchemeError"></div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="fundUnits">Units</label>
              <input type="number" id="fundUnits" required min="0" step="0.001" placeholder="0.000" class="input-field">
              <div class="error-message" id="fundUnitsError"></div>
            </div>
            <div class="form-group">
              <label for="fundPurchaseNAV">Purchase NAV</label>
              <input type="number" id="fundPurchaseNAV" required min="0" step="0.01" placeholder="0.00" class="input-field">
              <div class="error-message" id="fundPurchaseNAVError"></div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="fundInvestmentAmount">Investment Amount</label>
            <input type="number" id="fundInvestmentAmount" required min="0" step="0.01" placeholder="0.00" class="input-field">
            <div class="error-message" id="fundInvestmentAmountError"></div>
          </div>
          
          <div class="form-group">
            <label for="fundPurchaseDate">Purchase Date</label>
            <input type="date" id="fundPurchaseDate" required class="input-field" placeholder="DD-MM-YYYY">
            <div class="error-message" id="fundPurchaseDateError"></div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary submit-btn">Add Mutual Fund</button>
            <button type="button" class="btn-secondary" onclick="hideAddMutualFundModal()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = "block";

  // Freeze the main window
  freezeMainWindow();

  // Setup input error handling for mutual fund modal
  setupMutualFundModalErrorHandling();

  // Set focus to the modal and first focusable element
  setTimeout(() => {
    const modalContent = modal.querySelector(".modal-content");

    // Set modal as focus trap and focus on modal content
    modalContent.setAttribute("tabindex", "-1");
    modalContent.focus();

    // Don't automatically focus on input field - let user navigate manually
    // All keyboard and mouse functionality remains intact

    // Setup modal focus trap
    setupModalFocusTrap(modal);
  }, 100);
}

function hideAddMutualFundModal() {
  const modal = document.getElementById("addMutualFundModal");
  if (modal) {
    // Reset all button states in the modal before removing
    resetAllButtonStates(modal);

    modal.remove();

    // Unfreeze the main window
    unfreezeMainWindow();

    // Restore focus to the element that opened the modal, then blur after a short delay
    if (modalTriggerElement) {
      modalTriggerElement.focus();

      // Remove focus outline after a short delay to prevent persistent focus styles
      setTimeout(() => {
        resetButtonState(modalTriggerElement);
        modalTriggerElement = null;
      }, 100);
    }
  }
}

// Add stock function
async function addStock(event) {
  event.preventDefault();

  // Clear any existing errors
  clearAllStockModalErrors();

  // Get submit button and set loading state
  const submitBtn = event.target.querySelector(".submit-btn");
  setButtonLoading(submitBtn, "Adding Stock...");

  try {
    const symbol = document
      .getElementById("stockSymbol")
      .value.trim()
      .toUpperCase();
    const exchange = document.getElementById("stockExchange").value;
    const quantity = parseInt(document.getElementById("stockQuantity").value);
    const purchasePrice = parseFloat(
      document.getElementById("stockPurchasePrice").value
    );
    const purchaseDate = document.getElementById("stockPurchaseDate").value;

    let hasErrors = false;

    // Validate stock exchange (required field)
    if (!exchange) {
      showStockModalError(
        "stockExchangeError",
        "Please select a stock exchange"
      );
      hasErrors = true;
    }

    // Validate stock symbol
    if (!symbol) {
      showStockModalError("stockSymbolError", "Stock symbol is required");
      hasErrors = true;
    } else if (symbol.length < 1) {
      showStockModalError(
        "stockSymbolError",
        "Please enter a valid stock symbol"
      );
      hasErrors = true;
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
      showStockModalError(
        "stockQuantityError",
        "Quantity must be greater than 0"
      );
      hasErrors = true;
    }

    // Validate purchase price
    if (!purchasePrice || purchasePrice <= 0) {
      showStockModalError(
        "stockPurchasePriceError",
        "Purchase price must be greater than 0"
      );
      hasErrors = true;
    }

    // Validate purchase date
    if (!purchaseDate) {
      showStockModalError(
        "stockPurchaseDateError",
        "Purchase date is required"
      );
      hasErrors = true;
    }

    if (hasErrors) {
      removeButtonLoading(submitBtn);
      return;
    }

    const session = getCurrentSession();
    if (!session) {
      showStockModalError("stockSymbolError", "Please login first");
      removeButtonLoading(submitBtn);
      return;
    }

    await loadUserData();
    const user = getUserData(session.email);
    if (!user) {
      showStockModalError("stockSymbolError", "User data not found");
      removeButtonLoading(submitBtn);
      return;
    }

    // Initialize portfolio if needed
    if (!user.portfolio) {
      user.portfolio = { stocks: [], mutualFunds: [] };
    }
    if (!user.portfolio.stocks) {
      user.portfolio.stocks = [];
    }

    // Add stock with new fields
    user.portfolio.stocks.push({
      symbol,
      company: symbol, // Will be updated when API integration is added
      exchange,
      quantity,
      avgPrice: purchasePrice,
      currentPrice: purchasePrice, // Initially same as purchase price
      purchaseDate,
      purchasePrice,
    });

    await setUserData(session.email, user);

    // Reset button state before hiding modal
    removeButtonLoading(submitBtn);
    resetButtonState(submitBtn);

    hideAddStockModal();
    loadUserPortfolio(session.email);
    showSuccessNotification("Stock added successfully!");
  } catch (error) {
    console.error("Add stock error:", error);
    removeButtonLoading(submitBtn);
    showStockModalError(
      "stockSymbolError",
      "Error adding stock. Please try again."
    );
  }
}

// Add mutual fund function
async function addMutualFund(event) {
  event.preventDefault();

  // Clear any existing errors
  clearAllMutualFundModalErrors();

  // Get submit button and set loading state
  const submitBtn = event.target.querySelector(".submit-btn");
  setButtonLoading(submitBtn, "Adding Mutual Fund...");

  try {
    const scheme = document.getElementById("fundScheme").value.trim();
    const units = parseFloat(document.getElementById("fundUnits").value);
    const purchaseNAV = parseFloat(
      document.getElementById("fundPurchaseNAV").value
    );
    const investmentAmount = parseFloat(
      document.getElementById("fundInvestmentAmount").value
    );
    const purchaseDate = document.getElementById("fundPurchaseDate").value;

    let hasErrors = false;

    // Validate mutual fund scheme
    if (!scheme) {
      showMutualFundModalError(
        "fundSchemeError",
        "Mutual fund scheme is required"
      );
      hasErrors = true;
    } else if (scheme.length < 2) {
      showMutualFundModalError(
        "fundSchemeError",
        "Please enter a valid mutual fund scheme"
      );
      hasErrors = true;
    }

    // Validate units
    if (!units || units <= 0) {
      showMutualFundModalError(
        "fundUnitsError",
        "Units must be greater than 0"
      );
      hasErrors = true;
    }

    // Validate purchase NAV
    if (!purchaseNAV || purchaseNAV <= 0) {
      showMutualFundModalError(
        "fundPurchaseNAVError",
        "Purchase NAV must be greater than 0"
      );
      hasErrors = true;
    }

    // Validate investment amount
    if (!investmentAmount || investmentAmount <= 0) {
      showMutualFundModalError(
        "fundInvestmentAmountError",
        "Investment amount must be greater than 0"
      );
      hasErrors = true;
    }

    // Validate purchase date
    if (!purchaseDate) {
      showMutualFundModalError(
        "fundPurchaseDateError",
        "Purchase date is required"
      );
      hasErrors = true;
    }

    // If there are validation errors, stop here
    if (hasErrors) {
      removeButtonLoading(submitBtn);
      return;
    }

    const session = getCurrentSession();
    if (!session) {
      showMutualFundModalError("fundSchemeError", "Please login first");
      removeButtonLoading(submitBtn);
      return;
    }

    await loadUserData();
    const user = getUserData(session.email);
    if (!user) {
      showMutualFundModalError("fundSchemeError", "User data not found");
      removeButtonLoading(submitBtn);
      return;
    }

    // Initialize portfolio if needed
    if (!user.portfolio) {
      user.portfolio = { stocks: [], mutualFunds: [] };
    }
    if (!user.portfolio.mutualFunds) {
      user.portfolio.mutualFunds = [];
    }

    // Add mutual fund
    user.portfolio.mutualFunds.push({
      scheme,
      units,
      purchaseNAV,
      investmentAmount,
      purchaseDate,
      dateAdded: new Date().toISOString(),
    });

    await setUserData(session.email, user);

    // Reset button state before hiding modal
    removeButtonLoading(submitBtn);
    resetButtonState(submitBtn);

    hideAddMutualFundModal();
    loadUserPortfolio(session.email);
    alert("Mutual fund added successfully!");
  } catch (error) {
    console.error("Add mutual fund error:", error);
    removeButtonLoading(submitBtn);
    showMutualFundModalError(
      "fundSchemeError",
      "Error adding mutual fund. Please try again."
    );
  }
}

// Edit functions (placeholder)
function editStock(index) {
  alert(`Edit stock at index ${index} - Feature coming soon!`);
}

function editMutualFund(index) {
  alert(`Edit mutual fund at index ${index} - Feature coming soon!`);
}

// Delete functions
async function deleteStock(index) {
  if (!confirm("Are you sure you want to delete this stock?")) return;

  const session = getCurrentSession();
  if (!session) return;

  await loadUserData();
  const user = getUserData(session.email);
  if (!user || !user.portfolio || !user.portfolio.stocks) return;

  user.portfolio.stocks.splice(index, 1);
  await setUserData(session.email, user);
  loadUserPortfolio(session.email);
  alert("Stock deleted successfully!");
}

async function deleteMutualFund(index) {
  if (!confirm("Are you sure you want to delete this mutual fund?")) return;

  const session = getCurrentSession();
  if (!session) return;

  await loadUserData();
  const user = getUserData(session.email);
  if (!user || !user.portfolio || !user.portfolio.mutualFunds) return;

  user.portfolio.mutualFunds.splice(index, 1);
  await setUserData(session.email, user);
  loadUserPortfolio(session.email);
  alert("Mutual fund deleted successfully!");
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initializeApp);
