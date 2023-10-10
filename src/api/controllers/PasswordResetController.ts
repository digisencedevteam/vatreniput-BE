import {
  generateSecureToken,
  sendPasswordResetEmail,
} from '../helpers/helper';
import {
  JsonController,
  Post,
  Body,
  BadRequestError,
  NotFoundError,
} from 'routing-controllers';
import bcrypt from 'bcrypt';
import { PasswordResetTokenService } from '../services/PasswordResetTokenService';
import { UserService } from '../services/UserService';

@JsonController('/password-reset')
export class PasswordResetController {
  private passwordResetTokenService: PasswordResetTokenService;
  private userService: UserService;
  constructor() {
    this.passwordResetTokenService = new PasswordResetTokenService();
    this.userService = new UserService();
  }

  @Post('/request')
  public async requestPasswordReset(
    @Body() requestBody: { email: string }
  ): Promise<any> {
    const { email } = requestBody;
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Generate a secure reset token (you can use a library like crypto-random-string)
    const token = await generateSecureToken(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 24 hours

    // Save the reset token in the database
    await this.passwordResetTokenService.createToken(
      user._id,
      token,
      expires
    );

    // Send the password reset email with the token
    await sendPasswordResetEmail(user.email, token);
    return user;
  }

  @Post('/reset')
  public async resetPassword(
    @Body() body: { token: string; newPassword: string }
  ): Promise<any> {
    const { token, newPassword } = body;

    // Use your password reset token service to find the user by the token
    const resetToken =
      await this.passwordResetTokenService.findTokenByToken(token);

    if (!resetToken || resetToken.expires < new Date()) {
      throw new BadRequestError('Invalid or expired token');
    }

    // Now that you have the user's unique identifier from the token, you can look up the user
    // in your database and update their password
    const user = await this.userService.findOneById(
      resetToken.userId
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }
    const hashedPassword =
      newPassword && (await bcrypt.hash(newPassword, 10));

    // Update the user's password
    await this.userService.updateUser(user._id, {
      password: hashedPassword,
    });

    // Delete the used reset token
    await this.passwordResetTokenService.deleteToken(user._id, token);
    return user;
  }
}
