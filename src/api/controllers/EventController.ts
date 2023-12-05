import {
  Get,
  JsonController,
  Authorized,
  Res,
  NotFoundError,
} from 'routing-controllers';
import { EventService } from '../services/EventService';
import { Response } from 'express';

@JsonController('/event')
export default class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  @Get('/all')
  @Authorized()
  async getAllEvents(@Res() res: Response) {
    const events = await this.eventService.getAllEvents();
    if (!events) {
      throw new NotFoundError('Trenutno nemamo dostupnih prvenstava.');
    }

    return res.json(events);
  }
}
