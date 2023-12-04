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
    try {
      const { email } = requestBody;
      const user = await this.userService.findOneByEmail(email);
      if (!user) {
        throw new BadRequestError('Korisnik nije pronađen!');
      }

      const token = await generateSecureToken(32);
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.passwordResetTokenService.createToken(
        user._id,
        token,
        expires
      );
      await sendPasswordResetEmail(user.email, token);

      return { message: 'E-mail za resetiranje lozinke poslan.' };
    } catch (error) {
      console.error('Greška pri zahtjevu za resetiranje lozinke:', error);
      throw new BadRequestError(
        'Došlo je do greške pri zahtjevu za resetiranje lozinke.'
      );
    }
  }

  @Post('/reset')
  public async resetPassword(
    @Body() body: { token: string; newPassword: string }
  ): Promise<any> {
    const { token, newPassword } = body;
    try {
      const resetToken = await this.passwordResetTokenService.findTokenByToken(
        token
      );
      if (!resetToken || resetToken.expires < new Date()) {
        throw new BadRequestError('Token nije važeći ili je istekao!');
      }
      const user = await this.userService.findOneById(resetToken.userId);
      if (!user) {
        throw new NotFoundError('Korisnik nije pronađen!');
      }
      const hashedPassword =
        newPassword && (await bcrypt.hash(newPassword, 10));
      await this.userService.updateUser(user._id, { password: hashedPassword });
      await this.passwordResetTokenService.deleteToken(user._id, token);

      return user;
    } catch (error: any) {
      if (error.message === 'UserNotFound') {
        throw new NotFoundError('Korisnik nije pronađen!');
      } else if (error.message === 'TokenExpired') {
        throw new BadRequestError('Token nije važeći ili je istekao!');
      } else {
        console.error('Greška pri resetiranju lozinke:', error);
        throw new BadRequestError(
          'Došlo je do greške pri resetiranju lozinke.'
        );
      }
    }
  }
}
