import Event from '../models/Event';

export class EventService {
  public async getAllEvents() {
    return await Event.find();
  }
}
