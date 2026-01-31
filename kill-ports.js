const { spawn } = require("child_process");

// Load environment variables from .env file
require("dotenv").config();

// Also load backend environment variables
require("dotenv").config({ path: "./backend/.env" });

// Configuration
const BACKEND_PORT = process.env.BACKEND_PORT || 3005;
const FRONTEND_PORT = process.env.PORT || 3000;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(prefix, message, color = colors.reset) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

// Function to kill process on a specific port
async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";

    if (isWindows) {
      // Windows: Use netstat and taskkill
      const findProcess = spawn("netstat", ["-ano"], { shell: true });
      let output = "";

      findProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      findProcess.on("close", () => {
        const lines = output.split("\n");
        const portPattern = new RegExp(`:${port}\\s`, "i");
        let foundProcess = false;

        for (const line of lines) {
          if (portPattern.test(line) && line.includes("LISTENING")) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];

            if (pid && !isNaN(pid)) {
              log(
                "KILL",
                `Killing process ${pid} on port ${port}`,
                colors.yellow
              );
              spawn("taskkill", ["/F", "/PID", pid], { shell: true });
              foundProcess = true;
            }
          }
        }

        if (!foundProcess) {
          log("KILL", `No process found on port ${port}`, colors.green);
        }

        setTimeout(resolve, 1000); // Give it time to kill
      });

      findProcess.on("error", (error) => {
        log(
          "ERROR",
          `Failed to check port ${port}: ${error.message}`,
          colors.red
        );
        resolve();
      });
    } else {
      // Unix/Linux/Mac: Use lsof and kill
      const findProcess = spawn("lsof", ["-ti", `tcp:${port}`]);
      let pid = "";

      findProcess.stdout.on("data", (data) => {
        pid += data.toString().trim();
      });

      findProcess.on("close", (code) => {
        if (code === 0 && pid) {
          log("KILL", `Killing process ${pid} on port ${port}`, colors.yellow);
          spawn("kill", ["-9", pid]);
        } else {
          log("KILL", `No process found on port ${port}`, colors.green);
        }
        setTimeout(resolve, 1000); // Give it time to kill
      });

      findProcess.on("error", (error) => {
        log(
          "ERROR",
          `Failed to check port ${port}: ${error.message}`,
          colors.red
        );
        resolve();
      });
    }
  });
}

async function main() {
  const ports = [FRONTEND_PORT, BACKEND_PORT];

  log(
    "CLEANUP",
    `Killing processes on development ports (${ports.join(", ")})...`,
    colors.bright
  );

  for (const port of ports) {
    await killProcessOnPort(port);
  }

  log("CLEANUP", "Port cleanup complete!", colors.green);
}

main().catch((error) => {
  log("ERROR", `Error: ${error.message}`, colors.red);
  process.exit(1);
});
