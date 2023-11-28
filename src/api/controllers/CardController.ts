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
import { Types } from 'mongoose';

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
  if (!cardId || !Types.ObjectId.isValid(cardId)) {
    throw new BadRequestError('Invalid or missing Card ID.');
  }

  try {
    const result = await this.cardService.addCardToAlbum(user._id, cardId);
    return { message: result };
  } catch (error) {
    console.error('Error in addCardToAlbum:', error);
    throw new BadRequestError('Error adding card to album.');
  }
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
  try {
    const { cards, totalCount } = await this.cardService.getAllCardsFromAlbum(
      user._id,
      Number(page),
      Number(limit)
    );
    return { cards, totalCount };
  } catch (error) {
    console.error('Error in getAllCardsFromUserAlbum:', error);
    throw new BadRequestError('Greška pri dobivanja sličica iz albuma');
  }
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
  @Authorized()
  async getCardStatsForDashboard(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response
  ) {
    try {
      const userId = user._id;

      // Execute all asynchronous operations in parallel
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
        votings, // Fixed typo from 'votingsÍ' to 'votings'
      };

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'An error occurred while fetching dashboard stats',
      });
    }
  }
}
