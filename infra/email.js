import nodemailer from "nodemailer";
import ServiceError from "infra/errors.js";
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production" ? true : false,
});
async function send(mail_options) {
  try {
    const a = await transporter.sendMail(mail_options);
    console.log(a);
  } catch (error) {
    throw new ServiceError({
      message: "Não foi possível enviar o email",
      action: "Verifique se o serviço de email está disponível.",
      cause: error,
      context: mail_options,
    });
  }
}

const email = {
  send,
};

export default email;
