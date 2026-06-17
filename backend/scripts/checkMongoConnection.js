require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
  override: true,
});

const mongoose = require("mongoose");
const {
  mongoConnectOptions,
  redactMongoUrl,
  getMongoTroubleshootingHint,
  verifyMongoSrvRecord,
} = require("../config/db");

const checkMongoConnection = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not set");
    }

    console.log("Checking MongoDB:", redactMongoUrl(process.env.MONGO_URL));
    await verifyMongoSrvRecord(process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL, mongoConnectOptions);
    console.log("MongoDB connected");
    console.log("Database:", mongoose.connection.name);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error(getMongoTroubleshootingHint(error));
    process.exit(1);
  }
};

checkMongoConnection();
