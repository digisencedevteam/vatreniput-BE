import {
  Get,
  JsonController,
  Param,
  Put,
  Authorized,
  Post,
  Body,
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from 'routing-controllers';
import { AlbumService } from '../services/AlbumService';

@JsonController('/album')
export default class AlbumController {
  private albumService: AlbumService;

  constructor() {
    this.albumService = new AlbumService();
  }

  @Get('/:code')
  @Authorized()
  async getAlbumByCode(@Param('code') code: string) {
    if (!code) {
      throw new BadRequestError('Nedostaje kod albuma.');
    }
    const album = await this.albumService.findOneByCode(code);
    if (!album) {
      throw new NotFoundError('Album ne postoji.');
    }

    return album;
  }

  @Get('/validate/:code')
  async validateAlbumByCode(@Param('code') code: string) {
    if (!code) {
      throw new BadRequestError('Nedostaje kod albuma.');
    }
    const album = await this.albumService.findOneByCode(code);
    if (!album) {
      throw new NotFoundError('Album ne postoji.');
    }
    const isAlbumValid = await this.albumService.validateOneByCode(code);
    if (!isAlbumValid) {
      throw new BadRequestError('Album s danim kodom nije validan.');
    }

    return isAlbumValid;
  }

  @Put('/use/:id')
  @Authorized()
  async useAlbum(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestError('Nedostaje ID albuma.');
    }
    const album = this.albumService.findOneById(id);
    if (!album) {
      throw new NotFoundError('Album ne postoji.');
    }
    const updatedAlbum = await this.albumService.updateAlbumUsed(id);
    if (!updatedAlbum) {
      throw new BadRequestError(
        'Album nije uspješno ažuriran za vlasništvo korisnika.'
      );
    }

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
    if (!code) {
      throw new BadRequestError('Nedostaje kod albuma.');
    }
    const savedAlbum = await this.albumService.create(code, isUsed);
    if (!savedAlbum) {
      throw new InternalServerError('Album nije spremljen za korisnika.');
    }

    return savedAlbum;
  }
}
