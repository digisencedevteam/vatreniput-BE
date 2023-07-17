import { Body, JsonController, Post } from 'routing-controllers';
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
    requestBody: {
      email: string;
      password: string;
      username: string;
    }
  ) {
    const { email, password, username } = requestBody;

    const savedUser = await this.userService.registerUser(
      email,
      password,
      username
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

    return { accessToken };
  }
}
