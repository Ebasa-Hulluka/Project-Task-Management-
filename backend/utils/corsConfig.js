const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  "https://project-task-management-hn7o2cw4h-ebasa-hullukas-projects.vercel.app",
];

const isLocalDevOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch (error) {
    return false;
  }
};

const isVercelOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return url.hostname.endsWith(".vercel.app");
  } catch (error) {
    return false;
  }
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (configuredOrigins.length === 0) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (defaultAllowedOrigins.includes(origin)) return true;
  return isLocalDevOrigin(origin) || isVercelOrigin(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: Origin ${origin} is not allowed.`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = {
  configuredOrigins,
  corsOptions,
  isOriginAllowed,
};
