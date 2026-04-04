import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import logger from './logger';

config();

let transporter: nodemailer.Transporter | null = null;

export const initializeEmail = (): void => {
  const host = process.env.SMTP_HOST || 'localhost';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'erp@aluminium.com';

  // If no SMTP config, log a warning and continue without email
  if (!host || host === 'localhost') {
    logger.warn('SMTP not configured. Email notifications will be logged but not sent.');
    return;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    from,
  });

  logger.info('Email transport initialized');
};

export const getTransporter = (): nodemailer.Transporter | null => transporter;

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!transporter) {
    logger.info(`[EMAIL MOCK] To: ${options.to}, Subject: ${options.subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'erp@aluminium.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error) {
    logger.error('Failed to send email', { error: (error as Error).message });
    throw error;
  }
};
