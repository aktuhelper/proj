import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  port: 465,  // For TLS
  auth: { 
    user: process.env.SMTP_USER,  
    pass: process.env.SMTP_KEY,   // Use the Brevo SMTP API key
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Verify the transporter connection
export default transporter;
