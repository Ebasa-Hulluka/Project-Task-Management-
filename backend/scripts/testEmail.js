require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
  override: true,
});

const { getTransporter } = require("../services/emailService");

const run = async () => {
  const now = new Date().toISOString();
  await getTransporter();
  console.log("SMTP transporter verified successfully.");
  console.log("Timestamp:", now);
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Email test failed:", error.message);
    process.exit(1);
  });
