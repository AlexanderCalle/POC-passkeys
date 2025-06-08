import * as nodemailer from 'nodemailer';
import config from '../config/config';

export const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  secure: true,
  port: 465,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});
