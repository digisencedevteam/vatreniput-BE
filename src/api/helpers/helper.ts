import * as crypto from 'crypto';
const sgMail = require('@sendgrid/mail');

// Define the Mailchimp list ID or audience ID
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sendgridEmailTemplateId = 'd-fb9e3fc9047d4c31b31c9608a7934c9b';
const sendgridEmailTemplateIdEmailConfirm =
  'd-4ecac326f754462f943110a79a4fb640';

/**
 * Generate a secure random token.
 * @param {number} length - The length of the token.
 * @returns {Promise<string>} A promise that resolves to the generated token.
 */
export async function generateSecureToken(
  length: number
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    crypto.randomBytes(length, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        const token = buffer.toString('hex');
        resolve(token);
      }
    });
  });
}

// Function to send a password reset email
export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const msg = {
    to: email,
    from: 'david.kraljic@digisence.agency',
    templateId: sendgridEmailTemplateId,
    dynamicTemplateData: {
      resetLink: `${backendAppLink}/reset-password/${token}`,
    },
  };

  try {
    await sgMail.send(msg);
    console.log('Password reset email sent successfully.');
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
  }
}

export async function sendVerificationEmail(
  email: string,
  verificationToken: string
) {
  const msg = {
    to: email,
    from: 'david.kraljic@digisence.agency',
    templateId: sendgridEmailTemplateIdEmailConfirm,
    dynamicTemplateData: {
      resetLink: `${frontendAppLink}/auth/verify-email?token=${verificationToken}`,
    },
  };
  try {
    await sgMail.send(msg);
    console.log('Email sent successfully.');
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
  }
}

export const isEnvDevelopment =
  process.env.BACKEND_APP_ENV === 'development';
export const isEnvProduction =
  process.env.BACKEND_APP_ENV === 'production';

type AtEnvProps = {
  defaultValue: string;
  staging?: string | undefined;
  development?: string | undefined;
  production?: string | undefined;
};

export const atEnv = ({
  defaultValue,
  development,
  production,
}: AtEnvProps) => {
  if (isEnvDevelopment) {
    return development || defaultValue;
  }
  if (isEnvProduction) {
    return production || defaultValue;
  }
  return defaultValue;
};

export const backendAppLink = atEnv({
  defaultValue: 'http://localhost:3001',
  development: 'https://vatreniput-be-8083fcaa25e5.herokuapp.com',
  production: 'https://vatreniput-be-8083fcaa25e5.herokuapp.com',
});

export const frontendAppLink = atEnv({
  defaultValue: 'http://localhost:3000/',
  development: 'https://vatreniput-fe.vercel.app/',
  production: 'https://vatreniput-fe.vercel.app/',
});
