const net = require("net");

function isPortFree(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        server.close(() => resolve(true));
      })
      .listen(port, host);
  });
}

async function findFreePort({ preferred, host = "127.0.0.1", rangeStart, rangeEnd }) {
  if (preferred) {
    const ok = await isPortFree(preferred, host);
    if (ok) return preferred;
  }

  const start = rangeStart ?? 3000;
  const end = rangeEnd ?? 3999;

  for (let port = start; port <= end; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await isPortFree(port, host);
    if (ok) return port;
  }

  throw new Error(`No free port found in range ${start}-${end}`);
}

/**
 * Finds two distinct ports: one for backend and one for frontend.
 * - Does NOT read .env.
 * - Prefers the provided preferred ports if available.
 */
async function findFreePorts(options = {}) {
  const {
    host = "127.0.0.1",
    preferredBackendPort = 3005,
    preferredFrontendPort = 3000,
    backendRangeStart = 3001,
    backendRangeEnd = 3999,
    frontendRangeStart = 3000,
    frontendRangeEnd = 4999,
  } = options;

  const backendPort = await findFreePort({
    preferred: preferredBackendPort,
    host,
    rangeStart: backendRangeStart,
    rangeEnd: backendRangeEnd,
  });

  let frontendPort = await findFreePort({
    preferred: preferredFrontendPort,
    host,
    rangeStart: frontendRangeStart,
    rangeEnd: frontendRangeEnd,
  });

  if (frontendPort === backendPort) {
    frontendPort = await findFreePort({
      preferred: undefined,
      host,
      rangeStart: Math.max(frontendRangeStart, backendPort + 1),
      rangeEnd: frontendRangeEnd,
    });
  }

  return { backendPort, frontendPort };
}

module.exports = {
  findFreePorts,
};
