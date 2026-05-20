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
  const sender = smtpUser || "no-reply@taskmanager.local";
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

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendNewUserCredentialsEmail = async ({ to, name, password, role }) => {
  const clientUrl = getEnv("CLIENT_URL", "http://localhost:5174");
  const displayName = String(name || "there").trim();
  const userRole = String(role || "user").trim();
  const username = String(to || "").trim().toLowerCase();
  const escapedClientUrl = escapeHtml(clientUrl);
  const escapedDisplayName = escapeHtml(displayName);
  const escapedUserRole = escapeHtml(userRole);
  const escapedUsername = escapeHtml(username);
  const escapedPassword = escapeHtml(password);

  return sendMail({
    to: username,
    subject: "Your Debo Task Manager account is ready",
    text: [
      `Hello ${displayName},`,
      "",
      `An admin created your Debo Task Manager ${userRole} account.`,
      "",
      `Website: ${clientUrl}`,
      `Username: ${username}`,
      `Password: ${password}`,
      "",
      "Use these details to sign in.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Hello ${escapedDisplayName},</p>
        <p>An admin created your Debo Task Manager ${escapedUserRole} account.</p>
        <p>
          <strong>Website:</strong> <a href="${escapedClientUrl}">${escapedClientUrl}</a><br />
          <strong>Username:</strong> ${escapedUsername}<br />
          <strong>Password:</strong> ${escapedPassword}
        </p>
        <p>Use these details to sign in.</p>
      </div>
    `,
  });
};

const sendAccountStatusEmail = async ({ to, name, action, role }) => {
  const clientUrl = getEnv("CLIENT_URL", "http://localhost:5174");
  const displayName = String(name || "there").trim();
  const normalizedAction = String(action || "updated").trim();
  const userRole = String(role || "user").trim();
  const username = String(to || "").trim().toLowerCase();

  return sendMail({
    to: username,
    subject: `Your Debo Task Manager account was ${normalizedAction}`,
    text: [
      `Hello ${displayName},`,
      "",
      `Your Debo Task Manager ${userRole} account was ${normalizedAction}.`,
      "",
      `Website: ${clientUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Hello ${escapeHtml(displayName)},</p>
        <p>Your Debo Task Manager ${escapeHtml(userRole)} account was ${escapeHtml(normalizedAction)}.</p>
        <p><strong>Website:</strong> <a href="${escapeHtml(clientUrl)}">${escapeHtml(clientUrl)}</a></p>
      </div>
    `,
  });
};

const sendRoleChangedEmail = async ({ to, name, previousRole, newRole }) => {
  const clientUrl = getEnv("CLIENT_URL", "http://localhost:5174");
  const displayName = String(name || "there").trim();
  const username = String(to || "").trim().toLowerCase();

  return sendMail({
    to: username,
    subject: "Your Debo Task Manager role was changed",
    text: [
      `Hello ${displayName},`,
      "",
      `Your account role was changed from ${previousRole} to ${newRole}.`,
      "",
      `Website: ${clientUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Hello ${escapeHtml(displayName)},</p>
        <p>Your account role was changed from <strong>${escapeHtml(previousRole)}</strong> to <strong>${escapeHtml(newRole)}</strong>.</p>
        <p><strong>Website:</strong> <a href="${escapeHtml(clientUrl)}">${escapeHtml(clientUrl)}</a></p>
      </div>
    `,
  });
};

const sendPasswordResetRequestEmail = async ({ to, name }) => {
  const displayName = String(name || "there").trim();
  const username = String(to || "").trim().toLowerCase();

  return sendMail({
    to: username,
    subject: "Password reset request received",
    text: [
      `Hello ${displayName},`,
      "",
      "Your password reset request was sent to the super admin.",
      "You will receive an email when a new password is created for your account.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Hello ${escapeHtml(displayName)},</p>
        <p>Your password reset request was sent to the super admin.</p>
        <p>You will receive an email when a new password is created for your account.</p>
      </div>
    `,
  });
};

const sendPasswordResetCompletedEmail = async ({ to, name, password }) => {
  const clientUrl = getEnv("CLIENT_URL", "http://localhost:5174");
  const displayName = String(name || "there").trim();
  const username = String(to || "").trim().toLowerCase();

  return sendMail({
    to: username,
    subject: "Your Debo Task Manager password was reset",
    text: [
      `Hello ${displayName},`,
      "",
      "The super admin created a new password for your account.",
      "",
      `Website: ${clientUrl}`,
      `Username: ${username}`,
      `New password: ${password}`,
      "",
      "Use these details to sign in, then change your password from Settings.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Hello ${escapeHtml(displayName)},</p>
        <p>The super admin created a new password for your account.</p>
        <p>
          <strong>Website:</strong> <a href="${escapeHtml(clientUrl)}">${escapeHtml(clientUrl)}</a><br />
          <strong>Username:</strong> ${escapeHtml(username)}<br />
          <strong>New password:</strong> ${escapeHtml(password)}
        </p>
        <p>Use these details to sign in, then change your password from Settings.</p>
      </div>
    `,
  });
};

module.exports = {
  sendNewUserCredentialsEmail,
  sendAccountStatusEmail,
  sendRoleChangedEmail,
  sendPasswordResetRequestEmail,
  sendPasswordResetCompletedEmail,
};
