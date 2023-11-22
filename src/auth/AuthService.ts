import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import * as express from 'express';
import User from '../api/models/User';
import dotenv from 'dotenv';

const ACCESS_TOKEN_EXPIRES = '1h';
const REFRESH_TOKEN_EXPIRES = '30d';

dotenv.config();

@Service()
export class AuthService {
  private readonly accessTokenSecret: string = process.env.ACCESS_TOKEN_SECRET || 'default-access-token-secret';
  private readonly refreshTokenSecret: string = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-token-secret';

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

  public async generateRefreshToken(userId: string): Promise<string | null> {
    const refreshToken = jwt.sign(
      { userId },
      this.refreshTokenSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRES }
    );  
    return refreshToken;
  }

  public async validateRefreshToken(refreshToken: string): Promise<{ userId: string, exp: number } | null> {
    try {
      const payload: any = jwt.verify(refreshToken, this.refreshTokenSecret);
      const user = await User.findById(payload.userId);
      if (!user) {        
        return null;
      }
      return { userId: payload.userId, exp: payload.exp };
    } catch (error) {
      return null;
    }
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
