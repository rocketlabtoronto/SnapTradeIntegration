// server_supabase.js
// This is a template for migrating your SnapTrade backend to Supabase for persistent storage.
// Replace in-memory userSecrets with Supabase queries. All other logic is preserved.

const express = require("express");
const cors = require("cors");
const { Snaptrade } = require("snaptrade-typescript-sdk");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3005;

app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend
);

// SnapTrade credentials
const SNAPTRADE_CLIENT_ID = process.env.SNAPTRADE_CLIENT_ID;
const SNAPTRADE_CONSUMER_KEY = process.env.SNAPTRADE_CONSUMER_KEY;

const snaptrade = new Snaptrade({
  clientId: SNAPTRADE_CLIENT_ID,
  consumerKey: SNAPTRADE_CONSUMER_KEY,
});

// Helper: Get user secret from Supabase
async function getUserSecret(userId) {
  const { data, error } = await supabase
    .from("user_secrets")
    .select("userSecret")
    .eq("userId", userId)
    .single();
  if (error) return null;
  return data?.userSecret || null;
}

// Helper: Store user secret in Supabase
async function storeUserSecret(userId, userSecret) {
  await supabase
    .from("user_secrets")
    .upsert({ userId, userSecret }, { onConflict: ["userId"] });
}

// Helper: Delete user secret from Supabase
async function deleteUserSecret(userId) {
  await supabase.from("user_secrets").delete().eq("userId", userId);
}

// Test API credentials
app.get("/api/status", async (req, res) => {
  try {
    const response = await snaptrade.apiStatus.check();
    res.json({
      status: "success",
      message: "SnapTrade API credentials are valid",
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "SnapTrade API credentials are invalid or API is down",
      error: error.response?.data || error.message,
    });
  }
});

// List all users
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_secrets")
      .select("userId, userSecret");
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new user
app.post("/api/users", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    // Check if user exists in Supabase
    const { data: existing, error: findErr } = await supabase
      .from("user_secrets")
      .select("userId")
      .eq("userId", userId)
      .single();
    if (existing) return res.status(409).json({ error: "User already exists" });

    // Register with SnapTrade
    const response = await snaptrade.authentication.registerSnapTradeUser({
      userId,
    });
    await storeUserSecret(userId, response.data.userSecret);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Delete user
app.delete("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await snaptrade.authentication.deleteSnapTradeUser({ userId });
    await deleteUserSecret(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Generate connection
app.get("/api/users/:userId/:userSecret/login", async (req, res) => {
  try {
    const { userId, userSecret } = req.params;
    if (!userId || !userSecret) {
      return res
        .status(400)
        .json({ error: "userId and userSecret are required in the URL." });
    }
    const response = await snaptrade.authentication.loginSnapTradeUser({
      userId,
      userSecret,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
  console.log("Supabase integration enabled. Table: user_secrets");
});

// ---
// Supabase table schema (SQL):
// create table user_secrets (
//   userId text primary key,
//   userSecret text not null
// );
