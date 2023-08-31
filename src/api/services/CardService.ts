import { BadRequestError } from 'routing-controllers';
import Card from '../models/Card';
import Album from '../models/Album';
import { Types } from 'mongoose';

export class CardService {
  public async getCardWithEventDetails(cardId: string) {
    const card = await Card.findById(cardId).populate('event');
    if (!card) {
      throw new BadRequestError('Card not found!');
    }
    return card.toObject();
  }
  public async createCard(
    cardData: Partial<typeof Card>
  ): Promise<typeof Card> {
    const card = new Card(cardData);
    await card.save();
    return card.toObject();
  }
  public async markCardAsUsed(
    cardId: string
  ): Promise<typeof Card | null> {
    return await Card.findByIdAndUpdate(
      cardId,
      { isUsed: true },
      { new: true }
    );
  }
  public async findOneById(id: string) {
    const card = await Card.findOne({ _id: id });
    return card?.toObject();
  }

  public async validateCard(cardId: string): Promise<boolean> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Card not found!');
    }
    return !card.toObject().isScanned;
  }

  public async addCardToAlbum(userId: string, cardId: string) {
    // Find the card with the scannedCode and where isScanned is false
    const card = await Card.findOne({
      _id: cardId,
      isScanned: false,
    });

    if (!card) {
      throw new BadRequestError('Card not found or already scanned!');
    }

    // Mark card as scanned
    card.isScanned = true;
    await card.save();

    // Add card to user's album
    let album = await Album.findOne({ owner: userId });

    if (!album) {
      throw new BadRequestError('User album not found!');
    }

    if (album.cards.map((id) => id.toString()).includes(cardId)) {
      throw new Error('Card already added to the album!');
    }

    album.cards.push(card._id);
    await album.save();
  }

  public async getAllCardsFromAlbum(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    // Fetch user's album
    const album = await Album.findOne({ owner: userId });
    if (!album) {
      throw new Error('Album not found!');
    }

    // Fetch paginated cards
    const cards = await Card.find({ _id: { $in: album.cards } })
      .populate('event')
      .skip(skip)
      .limit(limit);
    const totalCount = await Card.countDocuments({
      _id: { $in: album.cards },
    });

    return {
      cards: cards.map((card) => ({
        ...card.toObject(),
        _id: card._id.toString(),
      })),
      totalCount,
    };
  }

  public async getCardsForEvent(
    eventId: string,
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    // Fetch user's album
    const album = await Album.findOne({ owner: userId });
    if (!album) {
      throw new Error('Album not found!');
    }

    // Fetch cards associated with the event with pagination
    const cards = await Card.find({ event: eventId })
      .populate('event')
      .skip(skip)
      .limit(limit);

    const totalCount = await Card.countDocuments({ event: eventId });

    if (!cards.length) {
      throw new Error('No cards found for the given event!');
    }

    // Map over the cards to add the isCollected flag
    const cardsWithFlag = cards.map((card) => {
      const cardObj = card.toObject();
      cardObj._id = card._id.toString();
      // @ts-ignore
      cardObj.isCollected = album.cards.includes(card._id);
      return cardObj;
    });

    return {
      cards: cardsWithFlag,
      totalCount,
    };
  }
}
