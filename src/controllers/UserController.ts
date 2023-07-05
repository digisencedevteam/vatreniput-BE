import { Body, JsonController, Post } from 'routing-controllers';
import { UserService } from '../services/UserService';

@JsonController('/user')
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
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
}
