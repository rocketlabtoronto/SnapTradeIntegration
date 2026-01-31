import axios from "axios";

const USER_SECRETS_KEY = "snaptrade_userSecrets_v1";

function loadLocalSecrets() {
  try {
    const raw = localStorage.getItem(USER_SECRETS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getLocalUserSecret(userId) {
  const map = loadLocalSecrets();
  return map?.[userId] || null;
}

export async function fetchUserAccounts({ apiBase, userId }) {
  const userSecret = getLocalUserSecret(userId);
  if (!userSecret) {
    const err = new Error("User secret not found locally. Please re-register this user.");
    err.code = "NO_LOCAL_SECRET";
    throw err;
  }

  const res = await axios.post(`${apiBase}/users/accounts`, { userId, userSecret });
  return res.data;
}

export async function fetchUserHoldings({ apiBase, userId }) {
  const userSecret = getLocalUserSecret(userId);
  if (!userSecret) {
    const err = new Error("User secret not found locally. Please re-register this user.");
    err.code = "NO_LOCAL_SECRET";
    throw err;
  }

  const res = await axios.post(`${apiBase}/users/holdings`, { userId, userSecret });
  return res.data;
}

// Newer holdings endpoint is account-scoped.
export async function fetchUserHoldingsByAccount({ apiBase, userId, accountId }) {
  const userSecret = getLocalUserSecret(userId);
  if (!userSecret) {
    const err = new Error("User secret not found locally. Please re-register this user.");
    err.code = "NO_LOCAL_SECRET";
    throw err;
  }

  if (!accountId) {
    const err = new Error("accountId is required");
    err.code = "NO_ACCOUNT_ID";
    throw err;
  }

  const res = await axios.post(`${apiBase}/users/holdings`, {
    userId,
    userSecret,
    accountId,
  });
  return res.data;
}

// Best-effort normalization helper so the UI can render something even if the API shape differs.
export function normalizeHoldingsResponse(data) {
  if (!data) return { accounts: [], positions: [] };

  // Common shapes handling:
  // - { accounts: [...], holdings: [...] }
  // - { holdings: [...] }
  // - { data: ... }
  const accounts = data.accounts || data.brokerageAccounts || [];

  const positions =
    // SnapTrade getUserAccountPositions commonly returns an array of positions
    // or an object that contains them.
    data?.data?.positions ||
    data?.data?.holdings ||
    data?.data?.results ||
    data?.data ||
    data.holdings ||
    data.positions ||
    data.accountHoldings ||
    data.results ||
    data ||
    [];

  return {
    accounts,
    positions: Array.isArray(positions) ? positions : [],
    raw: data,
  };
}
