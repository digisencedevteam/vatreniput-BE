import { UserService } from '../services/UserService';
import { AuthService } from '../../auth/AuthService'
import {
  Get,
  JsonController,
  Authorized,
  CurrentUser,
  QueryParam,
  Res,
  Post,
  Req,
} from 'routing-controllers';
import { UserType } from '../../types/index';
import { frontendAppLink } from '../helpers/helper';
import { Request, Response } from 'express';
import { UnauthorizedError } from 'routing-controllers';


@JsonController('/auth')
export default class AuthController {
  private userService: UserService;
  private authService: AuthService

  constructor() {
    this.userService = new UserService();
    this.authService = new AuthService()
  }

  @Get('/verify-email')
  async verifyEmail(
    @QueryParam('token') token: string,
    @Res() response: Response
  ) {
    const user = await this.userService.getUserByVerificationToken(
      token
    );

    if (!user) {
      // Handle invalid token. Replace with your own error handling.
      return response.status(400).json({ message: 'Invalid token' });
    }

    if (!!user.isEmailVerified) {
      response.redirect(frontendAppLink);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;

    await user.save();

    // Redirect to frontend email verification success page
    response.redirect(frontendAppLink + 'email-verified');
  }

  @Get('/user')
  @Authorized()
  async getUser(@CurrentUser({ required: true }) user: UserType) {
    const userResponse =
      await this.userService.findOneWithoutPassword(user._id);
    return {
      user: userResponse,
    };
  }

  @Get('/refresh')
  async refresh(
    @Req() request: Request,
    @Res() response: Response
  ) {
    const oldRefreshToken = request.cookies['refreshToken'];
    if (!oldRefreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }
    try {
    const oldRefreshTokenData = await this.authService.validateRefreshToken(oldRefreshToken);    
    if (!oldRefreshTokenData || typeof oldRefreshTokenData === 'string') {
      throw new UnauthorizedError('Invalid refresh token');    
    }
    const refreshTokenExpirationDate = new Date(oldRefreshTokenData.exp * 1000);
    const currentDate = new Date();
    if (refreshTokenExpirationDate < currentDate) {
      throw new UnauthorizedError('Refresh token expired');
    }
    const user = await this.userService.findOneWithoutPassword(oldRefreshTokenData.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    await this.userService.updateLastLogin(user._id);
    const accessToken = await this.authService.generateAccessToken(user._id);
    const refreshToken = await this.authService.generateRefreshToken(user._id);
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      secure: process.env.BACKEND_APP_ENV !== 'development',
      sameSite: 'none' as 'none',
    };
    response.cookie('refreshToken', refreshToken, cookieOptions);
    return { accessToken };
  } catch (error) {
    throw new UnauthorizedError('Failed to refresh token');
  }
  }

  @Post('/logout')
  async logout(@Res() response: Response) {
    response.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.BACKEND_APP_ENV === 'development',
      sameSite: 'none',
      expires: new Date(0) 
  });
  return response.sendStatus(200);
}
}
