import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import * as express from 'express';
import User from '../api/models/User';

const ACCESS_TOKEN_EXPIRES = '14d';
const REFRESH_TOKEN_EXPIRES = '30d';

@Service()
export class AuthService {
  private readonly accessTokenSecret: string =
    'your-access-token-secret';

  public async generateAccessToken(userId: string): Promise<string> {
    const accessToken = await jwt.sign(
      { userId },
      this.accessTokenSecret,
      {
        expiresIn: ACCESS_TOKEN_EXPIRES,
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
  public validateJwt(
    token: string,
    options?: jwt.VerifyOptions
  ): any {
    try {
      const jwtPayload = jwt.verify(
        token,
        this.accessTokenSecret,
        options
      );
      return jwtPayload;
    } catch (error) {
      return undefined;
    }
  }

  public getTokenFromHeader(req: express.Request): any {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      return req.headers.authorization.split(' ')[1];
    }
    console.log('No token provided by the client');
    return undefined;
  }

  public async getUser(id: string): Promise<any> {
    const user = await User.findOne({ _id: id });
    return user;
  }
}
