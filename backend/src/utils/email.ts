import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail", // You can change this based on your provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS not set. Email not sent.");
    console.log(`[Mock Email to ${options.to}] Sub: ${options.subject}`);
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"RentalSphere" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email delivery failed");
  }
};
