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
} from 'routing-controllers';
import { UserType } from '../../types/index';
import { AuthService } from '../../auth/AuthService';
import { UserService } from '../services/UserService';
import { UserError } from '../errors/UserError';
import Utils from '../../lib/utils';

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
    const savedUser = await this.userService.registerUser(
      requestBody,
      code
    );

    return savedUser;
  }

  @Post('/login')
  async login(
    @Body()
    requestBody: {
      email: string;
      password: string;
    }
  ) {
    const { email, password } = requestBody;

    // Check if the user exists
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid username or password');
    }
    if (!user.isEmailVerified) {
      throw new Error(
        'Molimo vas potvrdite svoj email kako bi pristupili aplikaciji.'
      );
    }

    // Verify the password
    const isPasswordValid = await this.authService.verifyPassword(
      password,
      user.password || ''
    );
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Generate an access token
    const accessToken = await this.authService.generateAccessToken(
      user._id
    );
    const returnedUser =
      await this.userService.findOneWithoutPassword(user._id);

    return { accessToken, user: returnedUser };
  }

  @Get('/me')
  @Authorized()
  async getMyInfo(@CurrentUser({ required: true }) user: UserType) {
    const me = await this.userService.findOneWithoutPassword(
      user._id
    );
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
      return new BadRequestError('Missing body.');
    }

    const targerUser = await this.userService.findOneWithoutPassword(
      userId
    );
    if (!targerUser) {
      return new UserError(404, 'User not found');
    }

    if (targerUser?._id !== user._id.toString()) {
      throw new UserError(
        403,
        'You dont have access to perform this action'
      );
    }
    if (body.email) {
      const emailResult = Utils.validEmail(body.email);
      if (!emailResult) {
        return new UserError(400, 'Email address is not vaild.');
      }
    }

    if (body.username) {
      const userNameResult = Utils.validUsername(body.username);
      if (!userNameResult) {
        return new UserError(
          400,
          'Username should only contain letters, numbers, and dots without spaces, only @-_+. special characters can be used.'
        );
      }
    }

    if (body.newPassword) {
      if (body.newPassword.length < 5) {
        return new UserError(
          400,
          'Password must be at least 8 characters and contain one upper case and one number, only !@#$%^&* special characters can be used.'
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
    const userToDelete =
      await this.userService.findOneWithoutPassword(userId);

    if (!userToDelete) {
      throw new UserError(404, 'User not found');
    }

    const userAccess =
      await this.userService.checkUserAccessForTargetUser(
        user,
        userToDelete
      );

    if (!userAccess) {
      throw new UserError(
        403,
        'You dont have access to perform this action'
      );
    }
    await this.userService.deleteUser(userId);
    return response.status(200).send({});
  }
}
