import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "admin@aramexlogistics.org",
    pass: "Valmont15#Benjamin2010",
  },
  tls: { rejectUnauthorized: false },
});

export const FROM_EMAIL = "AramexLogistics <admin@aramexlogistics.org>";

// Verify on startup
transporter.verify((error) => {
  if (error) {
    console.error("SMTP configuration error:", error);
  } else {
    console.log("SMTP is ready to send messages");
  }
});

export default transporter;