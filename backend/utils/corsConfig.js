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
  return isLocalDevOrigin(origin) || isVercelOrigin(origin);
};

const corsOptions = {
  origin(origin, callback) {
    return callback(null, origin || true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

module.exports = {
  corsOptions,
  isOriginAllowed,
};
