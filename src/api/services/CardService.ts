import { BadRequestError } from 'routing-controllers';
import Album from '../models/Album';
import { Types } from 'mongoose';
import CardTemplate from '../models/CardTemplate';
import PrintedCard from '../models/PrintedCard';
import UserCard from '../models/UserCard';

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
    // Find the printed card that's not yet scanned
    const printedCard = await PrintedCard.findOne({
      _id: printedCardId,
      isScanned: false,
    });
    console.log(printedCard)
    if (!printedCard) {
      throw new BadRequestError('Card not found or already scanned!');
    }

    // Mark the printed card as scanned
    printedCard.isScanned = true;
    await printedCard.save();

    // Add printed card to the UserCard
    const userCard = new UserCard({
      userId: new Types.ObjectId(userId),
      printedCardId: printedCard._id,
    });

    await userCard.save();

    // Add UserCard to user's album
    let album = await Album.findOne({ owner: userId });

    if (!album) {
      throw new BadRequestError('User album not found!');
    }

    album.cards.push(userCard._id);
    await album.save();
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
    console.log(album)
    const userCards = album?.cards || [];
    const printedCardIds = userCards.map(
      (uc: any) => uc.printedCardId.toString()
    );

    // Fetch paginated cards
    const cards = await CardTemplate.find({
      _id: { $in: printedCardIds },
    })
      .populate('event')
      .skip(skip)
      .limit(limit);

    const totalCount = await CardTemplate.countDocuments({
      _id: { $in: printedCardIds },
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
    const album = await Album.findOne({
      owner: new Types.ObjectId(userId),
    });
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

    // To determine which cards a user has collected, we'll fetch the user's UserCards
    const userCards = await UserCard.find({ user: userId });
    const userPrintedCardIds = userCards.map((uc) =>
      uc.printedCardId.toString()
    );

    // Map over the cards to add the isCollected flag
    const cardsWithFlag = cards.map((card) => {
      const cardObj = card.toObject();
      cardObj._id = card._id.toString();
      // @ts-ignore
      cardObj.isCollected = userPrintedCardIds.includes(card._id);
      return cardObj;
    });

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
