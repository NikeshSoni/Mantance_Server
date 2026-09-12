import transporter from "../config/mail.js";

const sendEmail = async (email, subject, html) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

export default sendEmail;