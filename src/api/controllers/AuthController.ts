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
import { AlbumService } from '../services/AlbumService';

@JsonController('/auth')
export default class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  @Get('/user')
  @Authorized()
  async getUser(@CurrentUser({ required: true }) user: UserType) {
    console.log(user, 'THIS IS CURRENT USER');

    const userResponse =
      await this.userService.findOneWithoutPassword(user._id);
    console.log(userResponse, 'THIS IS USER RESPONSE');
    return {
      user: userResponse,
    };
  }
}
