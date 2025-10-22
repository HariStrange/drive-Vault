const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: false, // use true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // prevents certificate errors
  },
});

// Verify transporter connection on startup
(async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");
  } catch (error) {
    console.error("❌ SMTP verification failed:", error.message);
    console.error("Check your .env SMTP credentials or network settings.");
  }
})();

// 🔹 Send verification email
const sendVerificationEmail = async (email, code) => {
  console.log("📧 Sending verification email to:", email);
  console.log("Using SMTP user:", process.env.SMTP_USER);

  const mailOptions = {
    from: `"Verification Team" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Email Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #007bff;">${code}</h1>
        <p>This code will expire in 15 minutes.</p>
        <br/>
        <p style="color: #888;">If you didn’t request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    if (error.response) console.error("SMTP Response:", error.response);
    return false;
  }
};

// 🔹 Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  console.log("📧 Sending password reset email to:", email);

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Support Team" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}" style="color:#007bff;">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <br/>
        <p style="color: #888;">If you didn’t request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    if (error.response) console.error("SMTP Response:", error.response);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
