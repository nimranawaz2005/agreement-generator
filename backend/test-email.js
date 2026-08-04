const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

console.log("-----------------------------------------");
console.log("Checking Environment Variables:");
console.log("EMAIL_USER:", process.env.EMAIL_USER || "❌ MISSING in .env");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ LOADED (hidden)" : "❌ MISSING in .env");
console.log("-----------------------------------------");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log("Testing SMTP Connection...");

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ CONNECTION FAILED:", error.message);
  } else {
    console.log("✅ SUCCESS: Gmail credentials and App Password are valid!");
    
    // Attempt sending a real test email
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "Test Email from Node.js",
      text: "If you received this, Nodemailer is working perfectly!"
    }, (err, info) => {
      if (err) {
        console.error("❌ FAILED TO SEND EMAIL:", err.message);
      } else {
        console.log("🚀 EMAIL SENT SUCCESSFULLY! Message ID:", info.messageId);
      }
    });
  }
});  