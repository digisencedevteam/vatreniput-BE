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

@JsonController('/album')
export default class AlbumController {
  private albumService: AlbumService;

  constructor() {
    this.albumService = new AlbumService();
  }

  @Get('/')
  @Authorized()
  async getAllAlbums() {
    const albums = await this.albumService.findAll();
    return albums;
  }

  @Get('/:code')
  @Authorized()
  async getAlbumByCode(@Param('code') code: string) {
    const album = await this.albumService.findOneByCode(code);
    if (!album) {
      throw new Error('Album not found');
    }
    return album;
  }

  @Get('/validate/:code')
  @Authorized()
  async validateAlbumByCode(
    @Param('code') code: string,
    @CurrentUser({ required: true }) user: UserType
  ) {
    // TODO - this is just example of how to check current user - remove this later
    console.log(user, 'this is current user');
    const isAlbumValid = await this.albumService.validateOneByCode(
      code
    );
    return {
      isAlbumValid,
    };
  }

  @Put('/use/:id')
  @Authorized()
  async useAlbum(@Param('id') id: string) {
    const updatedAlbum = await this.albumService.updateAlbumUsed(id);
    return updatedAlbum;
  }

  @Authorized()
  @Post('/')
  async createAlbum(
    @Body()
    requestBody: {
      code: string;
      isUsed?: boolean;
    }
  ) {
    const { code, isUsed } = requestBody;

    const savedAlbum = await this.albumService.create(code, isUsed);

    return savedAlbum;
  }
}
