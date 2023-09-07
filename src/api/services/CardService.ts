import { BadRequestError } from 'routing-controllers';
import Album from '../models/Album';
import mongoose, { Types } from 'mongoose';
import CardTemplate from '../models/CardTemplate';
import PrintedCard from '../models/PrintedCard';
import UserCard from '../models/UserCard';
import { ObjectId } from 'mongodb';


export class CardService {
  public async getCardWithEventDetails(cardId: string) {
    const card = await CardTemplate.findById(cardId).populate(
      'event'
    );
    if (!card) {
      throw new BadRequestError('Card not found!');
    }
    return card.toObject();
  }
  public async createCard(
    cardData: Partial<typeof CardTemplate>
  ): Promise<typeof CardTemplate> {
    const card = new CardTemplate(cardData);
    await card.save();
    return card.toObject();
  }

  public async findOneById(id: string) {
    const card = await CardTemplate.findOne({ _id: id });
    return card?.toObject();
  }

  public async validateCard(printedCardId: string): Promise<boolean> {
    const printedCard = await PrintedCard.findById(printedCardId);
    if (!printedCard) {
      throw new Error('Card not found!');
    }
    return !printedCard.isScanned;
  }

  public async addCardToAlbum(userId: string, printedCardId: string) {
    try {
      // Find the printed card that's not yet scanned
      const printedCard = await PrintedCard.findOneAndUpdate(
        {
          _id: printedCardId,
          isScanned: false,
        },
        { isScanned: true, owner: new Types.ObjectId(userId) },
        { new: true }
      );
  
      if (!printedCard) {
        throw new BadRequestError('Card not found or already scanned!');
      }
  
      // Create a new UserCard
      const userCard = new UserCard({
        userId: new Types.ObjectId(userId),
        printedCardId: printedCard._id,
      });
  
      await userCard.save();
  
      // Find or create the user's album
      let album = await Album.findOne({ owner: userId });
  
      if (!album) {
        album = new Album({ owner: userId, cards: [] });
      }
  
      album.cards.push(userCard._id);
      await album.save();
  
      return { success: true, message: 'Card added to album successfully.' };
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  public async getAllCardsFromAlbum(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    // Fetch user's album
    const album = await Album.findOne({ owner: userId }).populate(
      'cards'
    );
    // console.log(album);
    const userCards = album?.cards || [];
    const printedCardIds = userCards.map(
      (uc: any) => uc.printedCardId
    );
    const printetCardsNew = await PrintedCard.find({
      _id: { $in: printedCardIds },
    })
    console.log(printetCardsNew, 'PRINTANE');
    const newIds = printetCardsNew.map((uc: any) => uc.cardTemplate);

    // Fetch paginated cards
    const cards = await CardTemplate.find({
      _id: { $in: newIds },
    })
      .populate('event')
      .skip(skip)
      .limit(limit);

    const totalCount = await CardTemplate.countDocuments({
      _id: { $in: newIds },
    });

    return {
      cards: cards.map((card) => card.toObject()),
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

    // Fetch CardTemplates associated with the event with pagination
    const cards = await CardTemplate.find({ event: eventId })
      .populate('event')
      .skip(skip)
      .limit(limit);

    const totalCount = await CardTemplate.countDocuments({
      event: eventId,
    });

    if (!cards.length) {
      throw new Error('No cards found for the given event!');
    }

    // Map over the cards to add the isCollected flag
    const cardsWithFlag = await Promise.all(cards.map(async (card) => {
      const cardObj = card.toObject();
      cardObj._id = card._id.toString();

      // check if there is a matching printed card for the card template
      const printedCard = await PrintedCard.findOne({
        cardTemplate: card._id,
        isScanned: true
      });

      // check if the user has collected the printed card
      const userCard = printedCard
        ? await UserCard.findOne({ printedCardId: printedCard._id, userId })
        : null;

      //@ts-ignore
      cardObj.isCollected = !!userCard;
      return cardObj;
    }));

    return {
      cards: cardsWithFlag,
      totalCount,
    };
  }

  public async getCardStats(userId: string) {
    // Count of all CardTemplates
    const countOfAllCards = await CardTemplate.countDocuments();

    // Count of collected cards by user
    const album = await Album.findOne({
      owner: new Types.ObjectId(userId),
    });
    const numberOfCollectedCards = album ? album.cards.length : 0;

    // Calculate the percentage of collected cards
    const percentageOfCollectedCards =
      countOfAllCards === 0
        ? 0
        : (numberOfCollectedCards / countOfAllCards) * 100;
    return {
      numberOfCollectedCards,
      percentageOfCollectedCards,
      countOfAllCards,
    };
  }
}
