import { UserService } from '../services/UserService';
import {
  Get,
  JsonController,
  Authorized,
  CurrentUser,
  QueryParam,
  Res,
} from 'routing-controllers';
import { UserType } from '../../types/index';
import { frontendAppLink } from '../helpers/helper';

@JsonController('/auth')
export default class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  @Get('/verify-email')
  async verifyEmail(
    @QueryParam('token') token: string,
    @Res() response: any
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
}
