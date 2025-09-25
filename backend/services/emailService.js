const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_LOGIN,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const getPasswordResetURL = (user, token) =>
  `http://localhost:5173/password/reset/${user._id}/${token}`;

const resetPasswordTemplate = (user, url) => {
  const from = process.env.EMAIL_LOGIN;
  const to = user.email;
  const subject = 'CryptoChat Password Reset';
  const html = `
  <p>Hi ${user.firstName || user.email},</p>
  <p>You can use the following link to reset your password:</p>
  <a href=${url}>${url}</a>
  <p>Link expires in 1hr</p>
  <p>–Your friends at CryptoChat</p>
  `;

  return { from, to, subject, html };
};

module.exports = {
  transporter,
  getPasswordResetURL,
  resetPasswordTemplate,
};
