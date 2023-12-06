import { generateSecureToken, sendPasswordResetEmail } from '../helpers/helper';
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
    if (!email) {
      throw new BadRequestError('Nedostaje email korisnika.');
    }
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestError('Korisnik nije pronađen');
    }
    const token = await generateSecureToken(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.passwordResetTokenService.createToken(user._id, token, expires);
    await sendPasswordResetEmail(user.email, token);

    return user;
  }

  @Post('/reset')
  public async resetPassword(
    @Body() body: { token: string; newPassword: string }
  ): Promise<any> {
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      throw new BadRequestError('Nedostaju token ili nova lozinka.');
    }
    const resetToken = await this.passwordResetTokenService.findTokenByToken(
      token
    );
    if (!resetToken || resetToken.expires < new Date()) {
      throw new BadRequestError('Token je nevažeći ili je istekao.');
    }
    const user = await this.userService.findOneById(resetToken.userId);
    if (!user) {
      throw new NotFoundError('Korisnik nije pronađen.');
    }
    const hashedPassword = newPassword && (await bcrypt.hash(newPassword, 10));
    await this.userService.updateUser(user._id, {
      password: hashedPassword,
    });
    await this.passwordResetTokenService.deleteToken(user._id, token);
    return user;
  }
}
