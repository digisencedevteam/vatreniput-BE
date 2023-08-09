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
}
