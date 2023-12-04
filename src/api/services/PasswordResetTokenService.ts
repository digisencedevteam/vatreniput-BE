import { Service } from 'typedi';
import PasswordResetToken from '../models/PasswordResetToken';

@Service()
export class PasswordResetTokenService {
  public async createToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<void> {
    const passwordResetToken = new PasswordResetToken({
      userId,
      token,
      expires,
    });
    await passwordResetToken.save();
  }

  public async findTokenByToken(token: string): Promise<any | null> {
    return await PasswordResetToken.findOne({ token }).exec();
  }

  public async deleteToken(userId: string, token: string): Promise<void> {
    await PasswordResetToken.findOneAndDelete({
      userId,
      token,
    }).exec();
  }
}
