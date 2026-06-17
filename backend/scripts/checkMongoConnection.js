require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
  override: true,
});

const {
  getMongoTroubleshootingHint,
  disconnectDB,
} = require("../config/db");
const connectDB = require("../config/db");

const checkMongoConnection = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not set");
    }

    console.log("Checking MongoDB connection");
    const connection = await connectDB();
    console.log("MongoDB connected");
    console.log("Database:", connection.name);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error(getMongoTroubleshootingHint(error));
    process.exit(1);
  }
};

checkMongoConnection();
