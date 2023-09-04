import { UserService } from '../services/UserService';
import {
  Get,
  JsonController,
  Param,
  Put,
  Authorized,
  Post,
  Body,
  CurrentUser,
} from 'routing-controllers';
import { UserType } from '../../types/index';

@JsonController('/auth')
export default class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  @Get('/user')
  @Authorized()
  async getUser(@CurrentUser({ required: true }) user: UserType) {
    const userResponse =
      await this.userService.findOneWithoutPassword(user._id);
    console.log(userResponse, 'THIS IS USER RESPONSE');
    return {
      user: userResponse,
    };
  }
}
