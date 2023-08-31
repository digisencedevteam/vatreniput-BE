import {
  Get,
  JsonController,
  Param,
  Put,
  Authorized,
  Post,
  Body,
  CurrentUser,
  QueryParam,
  BadRequestError,
  Patch,
  Res,
} from 'routing-controllers';
import { UserType } from '../../types/index';
import { CardService } from '../services/CardService';
import * as express from 'express';

@JsonController('/card')
export default class CardController {
  private cardService: CardService;

  constructor() {
    this.cardService = new CardService();
  }

  @Patch('/add')
  @Authorized()
  async addCardToAlbum(
    @CurrentUser({ required: true }) user: UserType,
    @Body() body: { cardId: string },
    @Res() response: express.Response
  ) {
    const { cardId } = body;
    if (!cardId) {
      throw new BadRequestError('Card ID is required param.');
    }
    await this.cardService.addCardToAlbum(user._id, cardId);
    response.sendStatus(204);
  }

  @Get('/collected')
  @Authorized()
  async getAllCardsFromUserAlbum(
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ) {
    console.log(user, 'THIS IS USER');
    // Ensure `page` and `limit` are valid numbers and fall within reasonable bounds
    if (isNaN(page) || page < 1) {
      throw new BadRequestError('Invalid page value.');
    }

    // Limit the maximum number of cards fetched in a single request to 100 (or your preferred max)
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestError('Invalid limit value.');
    }
    const { cards, totalCount } =
      await this.cardService.getAllCardsFromAlbum(
        user._id,
        page,
        limit
      );
    return {
      cards,
      totalCount,
    };
  }

  @Get('/:code')
  @Authorized()
  async getCardByCode(@Param('code') code: string) {
    const card = await this.cardService.getCardWithEventDetails(code);

    return card;
  }

  @Get('/validate/:code')
  async validateCardByCode(@Param('code') code: string) {
    const isCardValid = await this.cardService.validateCard(code);
    return {
      isCardValid,
    };
  }

  @Get('/event/:eventId')
  @Authorized()
  async getCardsForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: any,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ) {
    if (isNaN(page) || page < 1) {
      throw new BadRequestError('Invalid page value.');
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestError('Invalid limit value.');
    }

    const { cards, totalCount } =
      await this.cardService.getCardsForEvent(
        eventId,
        user.id,
        page,
        limit
      );
    return {
      cards,
      totalCount,
    };
  }
}
