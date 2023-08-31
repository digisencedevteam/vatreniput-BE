// controllers/EventController.ts
import { Get, JsonController, Authorized } from 'routing-controllers';
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
    return await this.eventService.getAllEvents();
  }
}
