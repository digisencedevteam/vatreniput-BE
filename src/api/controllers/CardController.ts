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
} from 'routing-controllers';
import { CardService } from '../services/CardService';

@JsonController('/card')
export default class CardController {
  private cardService: CardService;

  constructor() {
    this.cardService = new CardService();
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

  @Get('/collected')
  @Authorized()
  async getAllCardsFromUserAlbum(
    @CurrentUser() user: any,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ) {
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
        user.id,
        page,
        limit
      );
    return {
      cards,
      totalCount,
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
