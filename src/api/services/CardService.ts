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
}
