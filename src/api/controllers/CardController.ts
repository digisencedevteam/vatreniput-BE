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
      throw new BadRequestError('Card ID is required param.');
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
    // Ensure `page` and `limit` are valid numbers and fall within reasonable bounds
    if (page < 1) {
      throw new BadRequestError('Invalid page value.');
    }

    // Limit the maximum number of cards fetched in a single request to 100 (or your preferred max)
    if (limit < 1 || limit > 100) {
      throw new BadRequestError('Invalid limit value.');
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

  @Get('/details/:printedCardId')
  async getCardDetails(
    @Param('printedCardId') printedCardId: string
  ) {
    return this.cardService.getCardDetails(printedCardId);
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
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ) {
    if (page < 1) {
      throw new BadRequestError('Invalid page value.');
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestError('Invalid limit value.');
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
  @Get('/stats/dashboard')
  @Authorized()
  async getCardStatsForDashboard(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response
  ) {
    try {
      const userId = user._id;

      // Execute all asynchronous operations in parallel
      const [cardStats, topEvents, quizzes, votings] =
        await Promise.all([
          this.cardService.getCardStats(userId),
          this.eventService.getTopEvents(userId),
          this.quizService.getRecentQuizzes(userId),
          this.votingService.getRecentUnvotedVotings(userId),
        ]);

      const result = {
        ...cardStats,
        topEvents,
        quizzes,
        votings, // Fixed typo from 'votingsÍ' to 'votings'
      };

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          error: 'An error occurred while fetching dashboard stats',
        });
    }
  }
}
