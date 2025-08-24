const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("."));

// User data persistence endpoints
app.post("/api/saveUserData", async (req, res) => {
  try {
    const userData = req.body;
    await fs.writeFile("userData.json", JSON.stringify(userData, null, 2));
    res.json({ success: true, message: "User data saved successfully" });
  } catch (error) {
    console.error("Error saving user data:", error);
    res.status(500).json({ success: false, error: "Failed to save user data" });
  }
});

app.get("/api/loadUserData", async (req, res) => {
  try {
    const data = await fs.readFile("userData.json", "utf8");
    const userData = JSON.parse(data);
    res.json(userData);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, return default structure
      const defaultData = { users: {}, sessions: {}, appSettings: {} };
      res.json(defaultData);
    } else {
      console.error("Error loading user data:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to load user data" });
    }
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Investment Tracker Server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Investment Tracker Server Started!");
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`📱 Local access: http://127.0.0.1:${PORT}`);
  console.log(`🌐 Network access: http://[your-ip]:${PORT}`);
  console.log("");
  console.log("📊 Investment Tracker Features:");
  console.log("   ✅ Static file serving");
  console.log("   ✅ User data persistence");
  console.log("   ✅ Local portfolio management");
  console.log("   ✅ Offline-first design");
  console.log("");
  console.log(
    "💡 Note: External API integrations removed for offline operation"
  );
});
