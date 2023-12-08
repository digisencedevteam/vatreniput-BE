import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from 'routing-controllers';
import Event from '../models/Event';
import mongoose from 'mongoose';

export class EventService {
  public async getAllEvents() {
    let events = await Event.find()
      .select({ _id: 1, name: 1, location: 1, year: 1, description: 1 })
      .sort({ year: 1 })
      .lean();

    // events = events.map((event) => ({
    //   ...event,
    //   _id: event._id.toString(),
    // }));

    return events;
  }

  public async findOneEventById(eventId: string) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new BadRequestError('Invalid event ID');
    }
    const event = await Event.findById(eventId);
    return event;
  }

  public async getUserCardsForEvent(
    eventId: string,
    userId: string
  ): Promise<{
    collectedCount: number;
    totalCount: number;
    overFiftyPercent: boolean;
  }> {
    const event = await Event.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(eventId) } },

      {
        $lookup: {
          from: 'cardtemplates',
          localField: '_id',
          foreignField: 'event',
          as: 'cards',
        },
      },

      {
        $project: {
          totalCount: { $size: '$cards' },
          cards: 1,
        },
      },

      { $unwind: '$cards' },

      {
        $lookup: {
          from: 'usercards',
          localField: 'cards._id',
          foreignField: 'cardTemplateId',
          as: 'userCards',
        },
      },
      { $match: { 'userCards.userId': new mongoose.Types.ObjectId(userId) } },

      {
        $group: {
          _id: '$_id',
          collectedCount: { $sum: { $size: '$userCards' } },
          totalCount: { $first: '$totalCount' },
        },
      },
      {
        $project: {
          _id: 0,
          collectedCount: 1,
          totalCount: 1,
          overFiftyPercent: {
            $gt: [{ $divide: ['$collectedCount', '$totalCount'] }, 0.49],
          },
        },
      },
    ]).exec();

    return event.length > 0
      ? event[0]
      : { collectedCount: 0, totalCount: 0, overFiftyPercent: false };
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
