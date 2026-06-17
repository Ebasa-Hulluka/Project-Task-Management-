const mongoose = require("mongoose");
const dns = require("dns").promises;

const mongoConnectOptions = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 20000,
  family: 4,
};

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
      setTimeout(() => reject(timeoutError), timeoutMS);
    }),
  ]);

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

const getMongoTroubleshootingHint = (err) => {
  if (
    err?.syscall === "querySrv" ||
    err?.code === "ETIMEOUT" ||
    err?.code === "MONGO_SRV_TIMEOUT"
  ) {
    return [
      "MongoDB DNS lookup failed before authentication.",
      "If you are using an Atlas mongodb+srv URL, check your internet/DNS/VPN/firewall, or replace it with Atlas' standard mongodb:// connection string.",
    ].join(" ");
  }

  if (err?.message?.includes("bad auth") || err?.code === 8000) {
    return "MongoDB rejected the username/password in MONGO_URL.";
  }

  if (err?.message?.includes("IP") || err?.message?.includes("whitelist")) {
    return [
      "MongoDB rejected this client IP.",
      "For Render deployments, add the service's outbound IP ranges in MongoDB Atlas Network Access.",
      "For local development, add your current IP address.",
      "Use 0.0.0.0/0 only as a temporary development/testing fallback.",
    ].join(" ");
  }

  return "Check MONGO_URL, Atlas Network Access, and whether the cluster is running.";
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not set");
    }

    await verifyMongoSrvRecord(process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL, mongoConnectOptions);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    console.error(getMongoTroubleshootingHint(err));
    throw err;
  }
};

module.exports = connectDB;
module.exports.mongoConnectOptions = mongoConnectOptions;
module.exports.redactMongoUrl = redactMongoUrl;
module.exports.getMongoTroubleshootingHint = getMongoTroubleshootingHint;
module.exports.verifyMongoSrvRecord = verifyMongoSrvRecord;
