import {
  Get,
  JsonController,
  Param,
  Put,
  Authorized,
  Post,
  Body,
} from 'routing-controllers';
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
  async validateAlbumByCode(@Param('code') code: string) {
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
