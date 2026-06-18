const dns = require("dns").promises;
const https = require("https");
const mongoose = require("mongoose");

/*
MongoDB Atlas troubleshooting checklist
---------------------------------------
If the app logs "MongoDB rejected this client IP" or Atlas mentions
"IP whitelist" / "Network Access":

1. Open MongoDB Atlas.
2. Select the project that owns this cluster.
3. Go to Security -> Network Access.
4. Add the public outbound IP address shown in the startup logs.
5. If deploying on Render:
   - Open your Render backend service.
   - Click Connect.
   - Open the Outbound tab.
   - Copy every outbound IP range shown there.
   - Add those ranges in Atlas Network Access.
6. Wait 1-2 minutes for Atlas to apply the rule, then redeploy/restart.

Temporary development fallback only:
- Add 0.0.0.0/0 in Atlas Network Access to allow all IPs.
- Do not leave 0.0.0.0/0 enabled for production unless you deliberately
  accept that security risk and have strong database credentials.

If the app logs an SRV/DNS error:
- Check internet/DNS/VPN/firewall settings.
- Try Atlas' "Standard connection string" format:
  mongodb://host1:27017,host2:27017,host3:27017/db?ssl=true&replicaSet=...&authSource=admin

If the app logs an authentication error:
- Verify the Atlas Database Access user exists.
- Verify the password in MONGO_URL is URL-encoded if it contains symbols.
- Verify the user has permissions for the target database.
*/

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

const retryConfig = {
  attempts: Number(process.env.MONGO_CONNECT_RETRIES) || 5,
  baseDelayMS: Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS) || 1000,
  maxDelayMS: Number(process.env.MONGO_CONNECT_MAX_RETRY_DELAY_MS) || 10000,
};

const mongoConnectOptions = {
  autoIndex: !isProduction,
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || (isProduction ? 20 : 10),
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || (isProduction ? 2 : 0),
  maxIdleTimeMS: Number(process.env.MONGO_MAX_IDLE_TIME_MS) || 60000,
  serverSelectionTimeoutMS:
    Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 15000,
  connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
  heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_MS) || 10000,
  family: Number(process.env.MONGO_IP_FAMILY) || 4,
};

let mongooseEventsRegistered = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const redactMongoUrl = (url = "") =>
  url
    .replace(
      /(mongodb(?:\+srv)?:\/\/)([^:@/]+)(?::([^@/]+))?@/,
      "$1<user>:<password>@",
    )
    .replace(/([?&][^=]+)=([^&]*)/g, "$1=<value>");

const isSrvMongoUrl = (url = "") => url.startsWith("mongodb+srv://");

const getMongoHostname = (url = "") => {
  try {
    return new URL(url).hostname;
  } catch (_) {
    return "";
  }
};

const withTimeout = (promise, timeoutMS, timeoutError) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => reject(timeoutError), timeoutMS);
      timer.unref?.();
    }),
  ]);

const fetchText = (url, timeoutMS = 3000) =>
  new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { timeout: timeoutMS, headers: { "User-Agent": "task-manager-api" } },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(body.trim());
            return;
          }

          reject(new Error(`Public IP service returned HTTP ${response.statusCode}`));
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Timed out while detecting public IP"));
    });
    request.on("error", reject);
  });

const detectPublicIp = async () => {
  const services = [
    "https://api.ipify.org",
    "https://checkip.amazonaws.com",
    "https://ifconfig.me/ip",
  ];

  for (const service of services) {
    try {
      const ip = await fetchText(service);
      if (/^[a-fA-F0-9:.]+$/.test(ip)) {
        return ip;
      }
    } catch (_) {}
  }

  return null;
};

const logPublicIp = async () => {
  const publicIp = await detectPublicIp();

  if (publicIp) {
    console.log(`Server public IP for MongoDB Atlas Network Access: ${publicIp}`);
    return publicIp;
  }

  console.warn(
    "Could not detect server public IP. If MongoDB Atlas blocks this deployment, copy the outbound IP from your hosting provider dashboard.",
  );
  return null;
};

const verifyMongoSrvRecord = async (mongoUrl) => {
  if (!isSrvMongoUrl(mongoUrl)) {
    return;
  }

  const hostname = getMongoHostname(mongoUrl);
  if (!hostname) {
    throw new Error("MONGO_URL is not a valid MongoDB URL");
  }

  const timeoutError = new Error(
    `Timed out resolving MongoDB SRV record for ${hostname}`,
  );
  timeoutError.code = "MONGO_SRV_TIMEOUT";
  timeoutError.syscall = "querySrv";

  await withTimeout(
    dns.resolveSrv(`_mongodb._tcp.${hostname}`),
    5000,
    timeoutError,
  );
};

const shouldVerifySrvBeforeConnect = () =>
  process.env.MONGO_VERIFY_SRV === "true";

const classifyMongoError = (err) => {
  const rootError = err?.cause || err;
  if (rootError !== err) {
    return classifyMongoError(rootError);
  }

  const message = err?.message || "";

  if (
    err?.syscall === "querySrv" ||
    err?.code === "ETIMEOUT" ||
    err?.code === "ENOTFOUND" ||
    err?.code === "EAI_AGAIN" ||
    err?.code === "MONGO_SRV_TIMEOUT"
  ) {
    return "dns";
  }

  if (
    message.includes("bad auth") ||
    message.includes("Authentication failed") ||
    err?.code === 8000
  ) {
    return "auth";
  }

  if (
    message.includes("IP") ||
    message.includes("whitelist") ||
    message.includes("Network Access") ||
    message.includes("tlsv1 alert internal error") ||
    message.includes("SSL routines")
  ) {
    return "ip";
  }

  if (
    err?.code === "ECONNREFUSED" ||
    err?.code === "ETIMEDOUT" ||
    err?.code === "ECONNRESET" ||
    message.includes("timed out") ||
    message.includes("Could not connect to any servers")
  ) {
    return "network";
  }

  return "unknown";
};

const getMongoTroubleshootingHint = (err) => {
  switch (classifyMongoError(err)) {
    case "dns":
      return [
        "MongoDB DNS lookup failed before authentication.",
        "Check internet/DNS/VPN/firewall settings.",
        "If your environment cannot resolve mongodb+srv records, use Atlas' standard mongodb:// connection string.",
      ].join(" ");
    case "auth":
      return [
        "MongoDB rejected the username/password in MONGO_URL.",
        "Check Atlas Database Access, confirm the database user exists, and URL-encode special characters in the password.",
      ].join(" ");
    case "ip":
      return [
        "MongoDB Atlas rejected this server IP.",
        "Add the startup public IP or your host's outbound IP ranges in Atlas Security -> Network Access.",
        "For Render, use the service dashboard's Connect -> Outbound IP ranges.",
        "Use 0.0.0.0/0 only as a temporary development/testing fallback.",
      ].join(" ");
    case "network":
      return [
        "MongoDB network connection failed.",
        "Check Atlas cluster status, firewall rules, outbound port 27017, VPN/proxy settings, and whether your hosting provider allows outbound MongoDB traffic.",
      ].join(" ");
    default:
      return [
        "MongoDB connection failed for an unknown reason.",
        "Check MONGO_URL, Atlas Network Access, Atlas Database Access, and whether the cluster is running.",
      ].join(" ");
  }
};

const getRetryDelay = (attempt) => {
  const exponentialDelay = retryConfig.baseDelayMS * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(exponentialDelay + jitter, retryConfig.maxDelayMS);
};

const shouldRetry = (err) => {
  const errorType = classifyMongoError(err);
  return ["dns", "network", "ip", "unknown"].includes(errorType);
};

const registerMongooseEvents = () => {
  if (mongooseEventsRegistered) {
    return;
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connection established");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB connection re-established");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection disconnected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  mongooseEventsRegistered = true;
};

const validateMongoUrl = (mongoUrl) => {
  if (!mongoUrl) {
    throw new Error("MONGO_URL is not set");
  }

  if (!mongoUrl.startsWith("mongodb://") && !mongoUrl.startsWith("mongodb+srv://")) {
    throw new Error("MONGO_URL must start with mongodb:// or mongodb+srv://");
  }
};

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;
  validateMongoUrl(mongoUrl);
  registerMongooseEvents();

  console.log(`MongoDB mode: ${NODE_ENV}`);
  await logPublicIp();

  let lastError;

  for (let attempt = 1; attempt <= retryConfig.attempts; attempt += 1) {
    try {
      if (mongoose.connection.readyState === 1) {
        console.log("MongoDB already connected");
        return mongoose.connection;
      }

      if (shouldVerifySrvBeforeConnect()) {
        await verifyMongoSrvRecord(mongoUrl);
      }

      await mongoose.connect(mongoUrl, mongoConnectOptions);

      console.log(`MongoDB connected to database: ${mongoose.connection.name}`);
      return mongoose.connection;
    } catch (err) {
      lastError = err;
      const canRetry = attempt < retryConfig.attempts && shouldRetry(err);

      console.error(
        `MongoDB connection attempt ${attempt}/${retryConfig.attempts} failed: ${err.message}`,
      );
      console.error(getMongoTroubleshootingHint(err));

      if (!canRetry) {
        break;
      }

      const delay = getRetryDelay(attempt);
      console.log(`Retrying MongoDB connection in ${delay}ms...`);
      await sleep(delay);
    }
  }

  const finalError = new Error(
    `MongoDB connection failed after ${retryConfig.attempts} attempt(s): ${lastError?.message}`,
  );
  finalError.cause = lastError;
  throw finalError;
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.mongoConnectOptions = mongoConnectOptions;
module.exports.redactMongoUrl = redactMongoUrl;
module.exports.getMongoTroubleshootingHint = getMongoTroubleshootingHint;
module.exports.verifyMongoSrvRecord = verifyMongoSrvRecord;
module.exports.detectPublicIp = detectPublicIp;
