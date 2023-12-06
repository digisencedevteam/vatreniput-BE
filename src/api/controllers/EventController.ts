import {
  Get,
  JsonController,
  Authorized,
  Param,
  CurrentUser,
  BadRequestError,
} from 'routing-controllers';
import { EventService } from '../services/EventService';
import { UserType } from '../../types/index';

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
    @CurrentUser({ required: true }) user: UserType
  ) {
    const event = this.eventService.findOneEventById(eventId);
    if (!event) {
      throw new BadRequestError('Prvenstvo nije pronađeno');
    }
    return await this.eventService.getUserCardsForEvent(eventId, user._id);
  }

  @Get('/all')
  @Authorized()
  async getAllEvents() {
    return await this.eventService.getAllEvents();
  }
}
