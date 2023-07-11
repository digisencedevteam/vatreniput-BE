import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';

@Service()
export class AuthService {
  private readonly accessTokenSecret: string =
    'your-access-token-secret';

  public async generateAccessToken(userId: string): Promise<string> {
    const accessToken = await jwt.sign(
      { userId },
      this.accessTokenSecret,
      {
        expiresIn: '120m',
      }
    );
    return accessToken;
  }

  public async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
