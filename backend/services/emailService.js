let nodemailer;

try {
  // Optional at runtime until dependency is installed.
  nodemailer = require("nodemailer");
} catch (error) {
  nodemailer = null;
}


let transporterPromise;
let warnedMissingConfig = false;
let transporterVerified = false;
let warnedSmtpSuccess = false;

const getEnv = (key, fallback = "") => {
  const value = process.env[key];
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const isMailConfigured = () => {
  return Boolean(
    getEnv("SMTP_HOST") &&
      getEnv("SMTP_PORT") &&
      getEnv("SMTP_USER") &&
      getEnv("SMTP_PASS") &&
      nodemailer,
  );
};

const getFromAddress = () => {
  const smtpUser = getEnv("SMTP_USER");
  const mailFrom = getEnv("MAIL_FROM");
  const sender = smtpUser || mailFrom || "no-reply@taskmanager.local";
  return `Debo Task Manager <${sender}>`;
};

const getSmtpPassword = () => {
  const rawPass = getEnv("SMTP_PASS");
  return rawPass.replace(/\s+/g, "");
};

const getTransporter = async () => {
  if (!isMailConfigured()) {
    const message =
      "[EmailService] SMTP is not configured correctly or nodemailer is missing.";
    if (!warnedMissingConfig) {
      console.warn(message);
      warnedMissingConfig = true;
    }
    throw new Error(message);
  }

  if (!transporterPromise) {
    const smtpHost = getEnv("SMTP_HOST");
    const smtpPort = Number(getEnv("SMTP_PORT")) || 587;
    const smtpSecure = String(getEnv("SMTP_SECURE")).toLowerCase() === "true";
    const smtpDebug = String(getEnv("SMTP_DEBUG")).toLowerCase() === "true";

    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: getEnv("SMTP_USER"),
          pass: getSmtpPassword(),
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        logger: smtpDebug,
        debug: smtpDebug,
      }),
    );
  }

  const transporter = await transporterPromise;

  if (!transporterVerified) {
    try {
      await transporter.verify();
      transporterVerified = true;
      if (!warnedSmtpSuccess) {
        console.log("[EmailService] SMTP verification succeeded.");
        warnedSmtpSuccess = true;
      }
    } catch (error) {
      const baseMessage = `[EmailService] SMTP verification failed: ${error.message}`;
      if (
        getEnv("SMTP_HOST") === "smtp.gmail.com" &&
        /invalid login|auth|username and password not accepted/i.test(error.message || "")
      ) {
        throw new Error(
          `${baseMessage}. Gmail requires an App Password (not your normal account password).`,
        );
      }
      throw new Error(baseMessage);
    }
  }

  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: String(to || "").trim(),
      subject,
      text,
      html,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];
    if (!accepted.length) {
      throw new Error(
        `[EmailService] Mail was not accepted by SMTP. rejected=${JSON.stringify(rejected)} response=${info.response || "n/a"}`,
      );
    }

    return info;
  } catch (error) {
    throw new Error(`[EmailService] Failed to send "${subject}" to ${to}: ${error.message}`);
  }
};

module.exports = {
  getTransporter,
};
