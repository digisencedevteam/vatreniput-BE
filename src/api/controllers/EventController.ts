import {
  Get,
  JsonController,
  Authorized,
  Param,
  CurrentUser,
} from 'routing-controllers';
import { EventService } from '../services/EventService';

@JsonController('/event')
export default class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  @Get('/user-cards/:eventId')
  @Authorized()
  async getUserCardsForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: any
  ) {
    return await this.eventService.getUserCardsForEvent(eventId, user.id);
  }

  @Get('/all')
  @Authorized()
  async getAllEvents() {
    return await this.eventService.getAllEvents();
  }
}
