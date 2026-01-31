// Test script to verify environment variables are loaded correctly
require("dotenv").config();

console.log("🔧 Environment Variables Test:");
console.log("PORT:", process.env.PORT || "Not set (default: 3000)");
console.log(
  "BACKEND_PORT:",
  process.env.BACKEND_PORT || "Not set (default: 3005)"
);
console.log(
  "REACT_APP_API_BASE_URL:",
  process.env.REACT_APP_API_BASE_URL || "Not set"
);

// Show what the scripts will use
const FRONTEND_PORT = process.env.PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 3005;

console.log("\n📋 Actual ports that will be used:");
console.log("Frontend will run on port:", FRONTEND_PORT);
console.log("Backend will run on port:", BACKEND_PORT);
console.log(
  "Frontend will connect to API:",
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3005/api"
);
