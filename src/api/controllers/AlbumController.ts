import {
  Get,
  JsonController,
  Param,
  Put,
  Authorized,
  Post,
  Body,
  BadRequestError,
  NotFoundError,
  InternalServerError,
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
    try {
      const albums = await this.albumService.findAll();
      if (albums.length === 0) {
        return [];
      }
      return albums;
    } catch (error: any) {
      console.error('Error retrieving all albums:', error);
      if (error.message === 'DatabaseQueryFailed') {
        throw new InternalServerError(
          'Došlo je do greške pri dohvaćanju albuma.'
        );
      }
      throw error;
    }
  }

  @Get('/:code')
  @Authorized()
  async getAlbumByCode(@Param('code') code: string) {
    try {
      const album = await this.albumService.findOneByCode(code);
      if (!album) {
        throw new NotFoundError('Album s navedenim kodom nije pronađen!');
      }
      return album;
    } catch (error: any) {
      console.error(`Error retrieving album by code: ${code}`, error);
      if (error.message === 'AlbumNotFound') {
        throw new NotFoundError('Album s navedenim kodom nije pronađen!');
      }
      throw new InternalServerError(
        'Došlo je do greške pri dohvaćanju albuma.'
      );
    }
  }

  @Get('/validate/:code')
  async validateAlbumByCode(
    @Param('code') code: string
  ): Promise<{ isAlbumValid: boolean }> {
    try {
      const isAlbumValid = await this.albumService.validateOneByCode(code);
      return { isAlbumValid };
    } catch (error: any) {
      console.error(`Error during album validation by code: ${code}`, error);
      if (error.message === 'DatabaseQueryFailed') {
        throw new InternalServerError(
          'Došlo je do greške pri validaciji albuma.'
        );
      }
      throw error;
    }
  }

  @Put('/use/:id')
  @Authorized()
  async useAlbum(@Param('id') id: string) {
    try {
      const updatedAlbum = await this.albumService.updateAlbumUsed(id);
      return updatedAlbum;
    } catch (error: any) {
      console.error(`Error in useAlbum function for album ID: ${id}`, error);
      switch (error.message) {
        case 'AlbumNotFound':
          throw new BadRequestError('Album nije pronađen.');
        case 'DatabaseUpdateFailed':
          throw new InternalServerError(
            'Došlo je do greške pri ažuriranju albuma.'
          );
        default:
          throw new InternalServerError('Internal Server Error');
      }
    }
  }

  @Authorized()
  @Post('/')
  async createAlbum(@Body() requestBody: { code: string; isUsed?: boolean }) {
    try {
      const { code, isUsed } = requestBody;
      const savedAlbum = await this.albumService.create(code, isUsed);
      return savedAlbum;
    } catch (error: any) {
      console.error(
        `Error in createAlbum function for album code: ${requestBody.code}`,
        error
      );
      switch (error.message) {
        case 'DatabaseSaveFailed':
          throw new InternalServerError(
            'Došlo je do greške pri spremanju albuma.'
          );
        default:
          throw new InternalServerError('Internal Server Error');
      }
    }
  }
}
