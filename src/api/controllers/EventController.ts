import {
  Get,
  JsonController,
  Authorized,
  BadRequestError,
  InternalServerError,
} from 'routing-controllers';
import { EventService } from '../services/EventService';

@JsonController('/event')
export default class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  @Get('/all')
  @Authorized()
  async getAllEvents() {
    try {
      const events = await this.eventService.getAllEvents();
      if (!events || events.length === 0) {
        return [];
      }
      return events;
    } catch (error: any) {
      console.error('Greška pri dohvaćanju svih događaja:', error.message);
      switch (error.message) {
        case 'DatabaseQueryFailed':
          throw new InternalServerError(
            'Došlo je do greške pri dohvaćanju događaja.'
          );
        default:
          throw new InternalServerError(
            'Došlo je do greške pri dohvaćanju događaja.'
          );
      }
    }
  }
}
