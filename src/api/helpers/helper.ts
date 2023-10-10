import * as crypto from 'crypto';
import mailchimp from '@mailchimp/mailchimp_marketing'; // Import the Mailchimp library

// Define the Mailchimp list ID or audience ID
const listId = 'your-list-id';

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
  resetLink: string
) {
  try {
    // Prepare the merge fields for the email template
    const mergeFields = {
      RESET_LINK: resetLink,
    };

    // Send the email using Mailchimp
    // @ts-ignore
    const response = await mailchimp.messages.send({
      message: {
        to: [{ email }],
        template: {
          id: 'your-template-id', // The ID of your Mailchimp email template
          merge_language: 'handlebars', // Use Handlebars for merge tags
          merge_fields: mergeFields, // Merge fields for dynamic content
        },
      },
    });

    // Handle the response, check for success or error
    if (response.status === 'sent') {
      console.log('Password reset email sent successfully.');
    } else {
      console.error(
        'Failed to send password reset email:',
        response.errors
      );
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
}

// // Example usage
// const userEmail = 'user@example.com';
// const resetToken = 'your-reset-token';
// const resetLink = `https://example.com/reset-password?token=${resetToken}`;

// sendPasswordResetEmail(userEmail, resetLink);
