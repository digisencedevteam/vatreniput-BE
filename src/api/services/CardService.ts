import { BadRequestError } from 'routing-controllers';
import Album from '../models/Album';
import { Types } from 'mongoose';
import CardTemplate from '../models/CardTemplate';
import PrintedCard from '../models/PrintedCard';
import UserCard from '../models/UserCard';

export class CardService {
  public async getCardWithEventDetails(cardId: string) {
    if (!Types.ObjectId.isValid(cardId)) {
      throw new Error('InvalidCardID');
    }
    const card = await CardTemplate.findById(cardId).populate('event');
    if (!card) {
      throw new Error('CardNotFound');
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

  public async getCardDetails(printedCardId: string) {
    if (!Types.ObjectId.isValid(printedCardId)) {
      throw new Error('InvalidCardID');
    }
    const card = await PrintedCard.findById(printedCardId);
    if (!card) {
      throw new Error('CardNotFound');
    }
    const cardTemplate = await CardTemplate.findById(
      card.cardTemplate
    ).populate('event');
    if (!cardTemplate) {
      throw new Error('CardDetailsNotFound');
    }
    return {
      ...cardTemplate.toObject(),
      isScanned: card.isScanned,
    };
  }

  public async findOneById(id: string) {
    const card = await CardTemplate.findOne({ _id: id });
    if (!card) {
      throw new Error('Sličica nije pronađena!');
    }
    return card?.toObject();
  }

  public async validateCard(printedCardId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(printedCardId)) {
      throw new Error('InvalidCardID');
    }
    const printedCard = await PrintedCard.findById(printedCardId);
    if (!printedCard) {
      throw new Error('CardNotFound');
    }
    return !printedCard.isScanned;
  }

  public async addCardToAlbum(
    userId: string,
    printedCardId: string
  ): Promise<string> {
    try {
      if (!Types.ObjectId.isValid(printedCardId)) {
        throw new BadRequestError('Neispravan ID sličice!');
      }
      const printedCard = await PrintedCard.findOne({
        _id: new Types.ObjectId(printedCardId),
      });
      if (!printedCard) {
        throw new BadRequestError('Sličica nije pronađena!');
      }
      if (printedCard.isScanned) {
        throw new BadRequestError('Sličica je već skenirana i iskorištena!');
      }
      const userCardExists = await UserCard.findOne({
        userId: new Types.ObjectId(userId),
        cardTemplateId: printedCard.cardTemplate,
      });
      if (userCardExists) {
        throw new BadRequestError('Sličica je već dodana u digitalni album!');
      }
      printedCard.isScanned = true;
      //@ts-ignore
      printedCard.owner = new Types.ObjectId(userId);
      await printedCard.save();
      const userCard = new UserCard({
        userId: new Types.ObjectId(userId),
        printedCardId: printedCard._id,
        cardTemplateId: printedCard.cardTemplate,
      });
      await userCard.save();
      let album = await Album.findOne({ owner: userId });
      if (!album) {
        album = new Album({ owner: userId, cards: [] });
      }
      album.cards.push(userCard._id);
      await album.save();

      return 'ok';
    } catch (error: any) {
      console.error('Error in addCardToAlbum:', error);
      throw new BadRequestError(
        error.message || 'Greška pri dodavanju sličice u album!'
      );
    }
  }

  public async getAllCardsFromAlbum(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    try {
      const album = await Album.findOne({ owner: userId }).populate('cards');
      if (!album) {
        throw new Error('Album nije pronađen.');
      }
      const userCards = album?.cards || [];
      const printedCardIds = userCards.map((uc: any) => uc.printedCardId);
      const printetCardsNew = await PrintedCard.find({
        _id: { $in: printedCardIds },
      });
      const newIds = printetCardsNew.map((uc: any) => uc.cardTemplate);
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
    } catch (error) {
      console.error(`Greška pri dohvaćanju sličica iz albuma: `, error);
      throw new Error('Greška pri dohvaćanju sličica iz albuma.');
    }
  }

  public async getRecentCardsFromAlbum(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('InvalidUserID');
    }
    try {
      const album = await Album.findOne({ owner: userId }).populate('cards');
      if (!album) {
        return [];
      }
      const printedCardIds = album.cards.map((uc: any) => uc.printedCardId);
      const printedCardsNew = await PrintedCard.find({
        _id: { $in: printedCardIds },
      });
      const newIds = printedCardsNew.map((uc: any) => uc.cardTemplate);
      const cards = await CardTemplate.find({ _id: { $in: newIds } }).limit(8);
      return cards;
    } catch (error: any) {
      console.error('Error in getRecentCardsFromAlbum:', error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async getCardsForEvent(
    eventId: string,
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const album = await Album.findOne({ owner: userId });
    if (!album) {
      throw new Error('Album not found!');
    }
    const cards = await CardTemplate.find({ event: eventId })
      .populate('event')
      .skip(skip)
      .limit(limit);

    const totalCount = await CardTemplate.countDocuments({
      event: eventId,
    });

    if (!cards.length) {
      throw new Error('Nema sličica s ovog prvenstva.');
    }
    const cardsWithFlag = await Promise.all(
      cards.map(async (card) => {
        const cardObj = card.toObject();
        cardObj._id = card._id.toString();
        const printedCard = await PrintedCard.findOne({
          cardTemplate: card._id,
          isScanned: true,
        });
        const userCard = printedCard
          ? await UserCard.findOne({
              printedCardId: printedCard._id,
              userId,
            })
          : null;
        //@ts-ignore
        cardObj.isCollected = !!userCard;
        return cardObj;
      })
    );
    return {
      cards: cardsWithFlag,
      totalCount,
    };
  }

  public async getCardStats(userId: string) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('InvalidUserID');
      }
      const countOfAllCards = await CardTemplate.countDocuments();
      const album = await Album.findOne({ owner: new Types.ObjectId(userId) });
      if (!album) {
        return {
          numberOfCollectedCards: 0,
          percentageOfCollectedCards: 0,
          countOfAllCards,
        };
      }
      const numberOfCollectedCards = album.cards.length;
      const percentageOfCollectedCards =
        countOfAllCards === 0
          ? 0
          : (numberOfCollectedCards / countOfAllCards) * 100;
      return {
        numberOfCollectedCards,
        percentageOfCollectedCards: Math.round(percentageOfCollectedCards),
        countOfAllCards,
      };
    } catch (error: any) {
      console.error(`Error in getCardStats for user: ${userId}`, error);
      throw new Error('Greška u dohvaćanju statistike kolekcije!');
    }
  }
}
