import {
  Body,
  Get,
  JsonController,
  Post,
  Authorized,
  CurrentUser,
  Param,
  Put,
  BadRequestError,
  Res,
  Delete,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from 'routing-controllers';
import { UserType } from '../../types/index';
import { AuthService } from '../../auth/AuthService';
import { UserService } from '../services/UserService';
import Utils from '../../lib/utils';
import * as express from 'express';

@JsonController('/user')
export default class UserController {
  private userService: UserService;
  private authService: AuthService;

  constructor() {
    this.userService = new UserService();
    this.authService = new AuthService();
  }

  @Post('/register/:code')
  async register(
    @Param('code') code: string,
    @Body()
    requestBody: UserType
  ) {
    const savedUser = await this.userService.registerUser(requestBody, code);

    return savedUser;
  }

  @Post('/login')
  async login(
    @Body() requestBody: { email: string; password: string },
    @Res() response: express.Response
  ) {
    const { email, password } = requestBody;
    if (!email || !password) {
      throw new BadRequestError('Nedostaje email ili lozinka.');
    }

    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError(
        'Pogrešan email ili lozinka. Molim pokušajte ponovno.'
      );
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedError(
        'Email nije potvrđen. Molimo vas da potvrdite vaš email kako biste pristupili aplikaciji.'
      );
    }
    const isPasswordValid = await this.authService.verifyPassword(
      password,
      user.password || ''
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('Pogrešna lozinka. Molim pokušajte ponovno.');
    }
    const accessToken = await this.authService.generateAccessToken(user._id);
    const refreshToken = await this.authService.generateRefreshToken(user._id);
    const returnedUser = await this.userService.findOneWithoutPassword(
      user._id
    );
    if (!returnedUser) {
      throw new NotFoundError('Korisnik nije pronađen.');
    }
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      secure: process.env.BACKEND_APP_ENV !== 'production',
      sameSite: 'none',
    });

    return response.json({ accessToken, user: returnedUser });
  }

  @Get('/me')
  @Authorized()
  async getMyInfo(@CurrentUser({ required: true }) user: UserType) {
    const me = await this.userService.findOneWithoutPassword(user._id);
    if (!me) {
      throw new NotFoundError('Korisnik nije pronađen.');
    }
    return {
      user: me,
    };
  }

  @Put('/:userId')
  @Authorized()
  async updateUser(
    @CurrentUser({ required: true }) user: UserType,
    @Param('userId') userId: string,
    @Body() body: Partial<UserType>
  ) {
    if (Object.keys(body).length === 0) {
      return new BadRequestError('Nedostaju podaci iz body-a');
    }
    const targetUser = await this.userService.findOneWithoutPassword(userId);
    console.log(targetUser);
    if (!targetUser) {
      return new NotFoundError('Korisnik nije pronađen.');
    }
    if (targetUser._id !== user._id.toString()) {
      throw new ForbiddenError('Nemate pristup za izvršavanje ove radnje.');
    }
    if (body.email) {
      const emailResult = Utils.validEmail(body.email);
      if (!emailResult) {
        return new BadRequestError('Email nije validan.');
      }
    }
    if (body.username) {
      const userNameResult = Utils.validUsername(body.username);
      if (!userNameResult) {
        return new BadRequestError(
          'Korisničko ime treba sadržavati samo slova, brojeve i točke bez razmaka, jedino specijalni znakovi @-_+. mogu se koristiti.'
        );
      }
    }
    if (body.newPassword) {
      if (body.newPassword.length < 5) {
        return new BadRequestError(
          'Lozinka mora biti duga najmanje 8 znakova i sadržavati jedno veliko slovo i jedan broj, jedino se specijalni znakovi !@#$%^&* mogu koristiti.'
        );
      }
    }
    return await this.userService.updateUser(user._id, body);
  }

  @Authorized()
  @Delete('/:userId')
  public async deleteUserAccount(
    @CurrentUser({ required: true }) user: any,
    @Param('userId') userId: string,
    @Res() response: any
  ): Promise<void> {
    const userToDelete = await this.userService.findOneWithoutPassword(userId);
    if (!userToDelete) {
      throw new NotFoundError('Korisnik nije pronađen.');
    }
    const userAccess = await this.userService.checkUserAccessForTargetUser(
      user,
      userToDelete
    );
    if (!userAccess) {
      throw new ForbiddenError('Nemate pristup za izvršavanje ove radnje.');
    }
    await this.userService.deleteUser(userId);
    return response.status(200).send({});
  }
}
