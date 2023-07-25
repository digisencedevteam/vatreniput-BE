import {
  Body,
  Get,
  JsonController,
  Post,
  Authorized,
  CurrentUser,
} from 'routing-controllers';
import { UserType } from '../../types/index';
import { AuthService } from '../../auth/AuthService';
import { UserService } from '../services/UserService';

@JsonController('/user')
export default class UserController {
  private userService: UserService;
  private authService: AuthService;

  constructor() {
    this.userService = new UserService();
    this.authService = new AuthService();
  }
  @Post('/register')
  async register(
    @Body()
    requestBody: UserType
  ) {
    const savedUser = await this.userService.registerUser(
      requestBody
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
    const me = this.userService.findOneWithoutPassword(user._id);
    return {
      user: me,
    };
  }
}
