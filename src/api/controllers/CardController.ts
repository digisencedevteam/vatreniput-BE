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
    @CurrentUser({ required: true }) korisnik: UserType,
    @Body() tijelo: { cardId: string }
  ): Promise<{ message: string }> {
    const { cardId } = tijelo;
    if (!cardId || !Types.ObjectId.isValid(cardId)) {
      throw new BadRequestError('Neispravan ili nedostajući ID sličice.');
    }
    try {
      const rezultat = await this.cardService.addCardToAlbum(
        korisnik._id,
        cardId
      );
      return { message: rezultat };
    } catch (error: any) {
      if (error.message.includes('Invalid card ID')) {
        throw new BadRequestError('Neispravan ID sličice.');
      } else if (error.message.includes('Card already scanned')) {
        throw new BadRequestError('Sličica je već skenirana.');
      } else if (error.message.includes('Card already in album')) {
        throw new BadRequestError('Sličica je već u albumu.');
      } else {
        throw new BadRequestError(
          'Došlo je do greške prilikom dodavanja sličice u album.'
        );
      }
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
  async getCardDetails(@Param('printedCardId') printedCardId: string) {
    try {
      return await this.cardService.getCardDetails(printedCardId);
    } catch (error: any) {
      console.error('Error in getCardDetails:', error);
      let errorMessage = 'Interna greška servera';
      switch (error.message) {
        case 'InvalidCardID':
          errorMessage = 'Neispravan ID sličice!';
          break;
        case 'CardNotFound':
          errorMessage = 'Sličica nije pronađena.';
          break;
        case 'CardDetailsNotFound':
          errorMessage = 'Detalji sličice nisu pronađeni.';
          break;
      }
      throw new BadRequestError(errorMessage);
    }
  }

  @Get('/:code')
  @Authorized()
  async getCardByCode(@Param('code') code: string) {
    try {
      return await this.cardService.getCardWithEventDetails(code);
    } catch (error: any) {
      console.error('Error in getCardByCode:', error);
      let errorMessage = 'Interna greška servera';
      switch (error.message) {
        case 'InvalidCardID':
          errorMessage = 'Neispravan ID sličice!';
          break;
        case 'CardNotFound':
          errorMessage = 'Sličica nije pronađena!';
          break;
      }
      throw new BadRequestError(errorMessage);
    }
  }

  @Get('/validate/:code')
  async validateCardByCode(@Param('code') code: string) {
    try {
      const isCardValid = await this.cardService.validateCard(code);
      return {
        isCardValid,
      };
    } catch (error: any) {
      console.error('Error in validateCardByCode:', error);
      let errorMessage = 'Interna greška servera';
      switch (error.message) {
        case 'InvalidCardID':
          errorMessage = 'Neispravan ID sličice!';
          break;
        case 'CardNotFound':
          errorMessage = 'Sličica nije pronađena!';
          break;
      }
      throw new BadRequestError(errorMessage);
    }
  }

  @Get('/event/:eventId')
  @Authorized()
  async getCardsForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestError('Neispravni parametri stranice.');
    }
    try {
      const { cards, totalCount } = await this.cardService.getCardsForEvent(
        eventId,
        user._id,
        page,
        limit
      );
      return { cards, totalCount };
    } catch (error: any) {
      console.error('Error in getCardsForEvent:', error);
      let errorMessage = 'Interna greška servera';
      switch (error.message) {
        case 'InvalidEventID':
          errorMessage = 'Neispravan ID događaja!';
          break;
        case 'AlbumNotFound':
          errorMessage = 'Album nije pronađen!';
          break;
        case 'CardsNotFound':
          errorMessage = 'Sličice za događaj nisu pronađene!';
          break;
      }
      throw new BadRequestError(errorMessage);
    }
  }

  @Get('/stats/all')
  @Authorized()
  async getCardStats(@CurrentUser({ required: true }) user: UserType) {
    try {
      const stats = await this.cardService.getCardStats(user._id);
      return stats;
    } catch (error: any) {
      console.error('Error in getCardStats:', error);
      let errorMessage = 'Interna greška servera';
      switch (error.message) {
        case 'InvalidUserID':
          errorMessage = 'Neispravan ID korisnika.';
          break;
        case 'DatabaseQueryFailed':
          errorMessage = 'Greška prilikom dohvaćanja podataka iz baze.';
          break;
      }
      throw new BadRequestError(errorMessage);
    }
  }

  @Get('/stats/dashboard')
  @Authorized()
  async getCardStatsForDashboard(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response
  ) {
    try {
      const userId = user._id;
      const [cardStats, cards, topEvents, quizzes, votings] = await Promise.all(
        [
          this.cardService.getCardStats(userId),
          this.cardService.getRecentCardsFromAlbum(userId),
          this.eventService.getTopEvents(userId),
          this.quizService.getRecentQuizzes(userId),
          this.votingService.getRecentUnvotedVotings(userId),
        ]
      );
      const result = { ...cardStats, cards, topEvents, quizzes, votings };
      return res.json(result);
    } catch (error: any) {
      console.error(
        'Greška prilikom dobavljanja podataka za početnu stranicu:',
        error
      );
      switch (error.message) {
        case 'InvalidUserID':
        case 'Neispravan ID korisnika':
          throw new BadRequestError('Nevažeći ID korisnika');
        case 'Kvizovi nisu pronađeni':
          throw new NotFoundError('Kvizovi nisu pronađeni');
        case 'Nepronađeni su neizglasani glasovi':
          throw new NotFoundError('Nepronađeni su neizglasani glasovi');
        case 'DatabaseQueryFailed':
          throw new InternalServerError('Došlo je do greške u bazi podataka');
        default:
          throw new InternalServerError(
            'Došlo je do greške pri dohvaćanju podataka za početnu stranicu.'
          );
      }
    }
  }
}
