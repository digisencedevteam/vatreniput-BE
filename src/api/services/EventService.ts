import Event from '../models/Event';

export class EventService {
  public async getAllEvents() {
    const events = await Event.find()
      .lean()
      .select({
        _id: 1,
        name: 1,
        location: 1,
        year: 1,
        description: 1,
      })
      .sort({ year: 1 })
      .exec();
    return events.map((event) => ({
      ...event,
      _id: event._id.toString(),
    }));
  }
}
