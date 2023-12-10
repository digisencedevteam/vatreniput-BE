import {
  Get,
  JsonController,
  Param,
  Authorized,
  Body,
  CurrentUser,
  QueryParam,
  BadRequestError,
  Patch,
  Res,
  NotFoundError,
  InternalServerError,
} from 'routing-controllers';
import { Response } from 'express';
import { UserType } from '../../types/index';
import { CardService } from '../services/CardService';
import { EventService } from '../services/EventService';
import { QuizService } from '../services/QuizService';
import { VotingService } from '../services/VotingService';

@JsonController('/card')
export default class CardController {
  private cardService: CardService;
  private eventService: EventService;
  private quizService: QuizService;
  private votingService: VotingService;

  constructor() {
    this.cardService = new CardService();
    this.eventService = new EventService();
    this.quizService = new QuizService();
    this.votingService = new VotingService();
  }

  @Patch('/add')
  @Authorized()
  async addCardToAlbum(
    @CurrentUser({ required: true }) user: UserType,
    @Body() body: { cardId: string }
  ) {
    const { cardId } = body;
    if (!cardId) {
      throw new BadRequestError('Nedostaje ID sličice.');
    }

    return await this.cardService.addCardToAlbum(user._id, cardId);
  }

  @Get('/collected')
  @Authorized()
  async getAllCardsFromUserAlbum(
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ) {
    if (page < 1) {
      throw new BadRequestError('Stranica ne postoji.');
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestError('Stranica ne postoji.');
    }
    const { cards, totalCount } =
      await this.cardService.getAllCardsFromAlbum(
        user._id,
        Number(page),
        Number(limit)
      );

    return {
      cards,
      totalCount,
    };
  }

  @Get('/details/:printedCardId/:userId')
  async getCardDetails(
    @Param('printedCardId') printedCardId: string,
    @Param('userId') userId?: string
  ) {
    if (!printedCardId) {
      throw new BadRequestError('Nedostaje ID sličice.');
    }
    const isCardValid = this.cardService.validateCard(printedCardId);
    if (!isCardValid) {
      throw new BadRequestError('Sličica nije važeća.');
    }

    return this.cardService.getCardDetails(printedCardId, userId);
  }

  @Get('/:code')
  @Authorized()
  async getCardByCode(@Param('code') code: string) {
    if (!code) {
      throw new BadRequestError('Nedostaje kod sličice.');
    }
    const card = await this.cardService.getCardWithEventDetails(code);

    return card;
  }

  @Get('/validate/:code')
  async validateCardByCode(@Param('code') code: string) {
    if (!code) {
      throw new BadRequestError('Nedostaje kod sličice.');
    }
    const isCardValid = await this.cardService.validateCard(code);
    return {
      isCardValid,
    };
  }

  @Get('/event/:eventId')
  @Authorized()
  async getCardsForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ) {
    if (page < 1) {
      throw new BadRequestError('Stranica nije pronađena.');
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestError('Stranica nije pronađena.');
    }
    if (!eventId) {
      throw new BadRequestError('Nedostaje ID prvenstva.');
    }
    const event = this.eventService.findOneEventById(eventId);
    if (!event) {
      throw new NotFoundError('Prvenstvo nije pronađeno.');
    }
    const { cards, totalCount } =
      await this.cardService.getCardsForEvent(
        eventId,
        user._id,
        Number(page),
        Number(limit)
      );

    return {
      cards,
      totalCount,
    };
  }

  @Get('/stats/all')
  @Authorized()
  async getCardStats(
    @CurrentUser({ required: true }) user: UserType
  ) {
    return await this.cardService.getCardStats(user._id);
  }

  @Get('/stats/dashboard')
  @Authorized()
  async getCardStatsForDashboard(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response
  ) {
    try {
      const userId = user._id;
      const [cardStats, cards, topEvents, quizzes, votings] =
        await Promise.all([
          this.cardService.getCardStats(userId),
          this.cardService.getRecentCardsFromAlbum(userId),
          this.eventService.getTopEvents(userId),
          this.quizService.getRecentQuizzes(userId),
          this.votingService.getRecentUnvotedVotings(userId),
        ]);
      const result = {
        ...cardStats,
        cards,
        topEvents,
        quizzes,
        votings,
      };

      return res.json(result);
    } catch (error) {
      throw new InternalServerError('Interna greška servera.');
    }
  }
}
