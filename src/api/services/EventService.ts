import { InternalServerError, NotFoundError } from 'routing-controllers';
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
    return events;
  }

  public async findOneEventById(eventId: string) {
    const event = await Event.findById(eventId);
    return event;
  }

  public async getTopEvents(userId: string): Promise<any[]> {
    try {
      const events = await Event.aggregate([
        {
          $lookup: {
            from: 'cardtemplates',
            localField: '_id',
            foreignField: 'event',
            as: 'cards',
          },
        },
        {
          $lookup: {
            from: 'usercards',
            localField: 'cards._id',
            foreignField: 'cardTemplateId',
            as: 'userCards',
          },
        },
        {
          $match: {
            'userCards.userId': userId,
          },
        },
        {
          $project: {
            name: 1,
            location: 1,
            year: 1,
            description: 1,
            numberOfCollected: { $size: '$userCards' },
            percentageCollected: {
              $multiply: [
                {
                  $divide: [{ $size: '$userCards' }, { $size: '$cards' }],
                },
                100,
              ],
            },
          },
        },
        {
          $sort: {
            percentageCollected: -1,
          },
        },
      ]).exec();
      return events;
    } catch (error) {
      throw new InternalServerError(
        'Neuspješno dohvaćanje sličica s najviše skupljenih prvenstva.'
      );
    }
  }
}
