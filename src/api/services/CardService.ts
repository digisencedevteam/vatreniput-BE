import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from 'routing-controllers';
import Album from '../models/Album';
import { Types } from 'mongoose';
import CardTemplate from '../models/CardTemplate';
import PrintedCard from '../models/PrintedCard';
import UserCard from '../models/UserCard';

export class CardService {
  public async getCardWithEventDetails(cardId: string) {
    const card = await CardTemplate.findById(cardId).populate('event').lean();
    if (!card) {
      throw new NotFoundError('Sličica nije pronađena.');
    }
    return card;
  }

  public async getCardDetails(printedCardId: string) {
    const card = await PrintedCard.findOne({
      _id: printedCardId,
      isScanned: false,
    });

    if (!card) {
      throw new NotFoundError('Sličica nije pronađena ili je veće skenirana.');
    }
    const cardTemplate = await CardTemplate.findOne({
      _id: card.cardTemplate,
    })
      .populate('event')
      .lean();
    if (!cardTemplate) {
      throw new NotFoundError('Sličica nije nađena.');
    }

    return cardTemplate;
  }

  public async findOneById(id: string) {
    const card = await CardTemplate.findOne({ _id: id }).lean();
    if (!card) {
      throw new NotFoundError('Sličica nije nađena.');
    }
    return card;
  }

  public async validateCard(printedCardId: string): Promise<boolean> {
    const printedCard = await PrintedCard.findById(printedCardId);
    if (!printedCard) {
      throw new NotFoundError('Sličica nije pronađena');
    }
    return !printedCard.isScanned;
  }

  public async addCardToAlbum(
    userId: string,
    printedCardId: string
  ): Promise<string> {
    try {
      const printedCard = await PrintedCard.findOne({
        _id: printedCardId,
        isScanned: false,
      });
      if (!printedCard) {
        throw new NotFoundError(
          'QR kod sa sličice je već skeniran i iskorišten!'
        );
      }
      const userCardExists = await UserCard.findOne({
        userId: new Types.ObjectId(userId),
        cardTemplateId: printedCard.cardTemplate,
      });
      if (userCardExists) {
        throw new BadRequestError('Sličica je već dodana u digitalni Almanah.');
      }
      printedCard.isScanned = true;
      // @ts-ignore
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
    } catch (error) {
      throw new InternalServerError('Interna greška servera.');
    }
  }

  public async getAllCardsFromAlbum(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const album = await Album.findOne({ owner: userId }).populate('cards');
    if (!album) {
      throw new NotFoundError('Album nije pronađen.');
    }
    const userCards = album.cards || [];
    const printedCardIds = userCards.map((uc: any) => uc.printedCardId);
    const printedCardsNew = await PrintedCard.find({
      _id: { $in: printedCardIds },
    });
    if (!printedCardsNew) {
      throw new NotFoundError('Sličica nije pronađena.');
    }
    const newIds = printedCardsNew.map((uc: any) => uc.cardTemplate);
    const cards = await CardTemplate.find({
      _id: { $in: newIds },
    })
      .populate('event')
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedCards = cards.map((card) => ({
      ...card,
      _id: card._id.toString(),
    }));
    const totalCount = await CardTemplate.countDocuments({
      _id: { $in: newIds },
    });
    return {
      cards: formattedCards,
      totalCount,
    };
  }

  public async getRecentCardsFromAlbum(userId: string) {
    const album = await Album.findOne({ owner: userId }).populate('cards');
    if (!album) {
      throw new NotFoundError('Album nije pronađen.');
    }
    const userCards = album.cards || [];
    const printedCardIds = userCards.map((uc: any) => uc.printedCardId);
    const printedCardsNew = await PrintedCard.find({
      _id: { $in: printedCardIds },
    });
    const newIds = printedCardsNew.map((uc: any) => uc.cardTemplate);
    const cards = await CardTemplate.find({
      _id: { $in: newIds },
    }).limit(8);

    return cards;
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
      throw new NotFoundError('Album nije pronađen!');
    }
    const cards = await CardTemplate.find({ event: eventId })
      .populate('event')
      .skip(skip)
      .limit(limit)
      .lean();

    if (!cards.length) {
      throw new NotFoundError('Nisu pronađene sličice ovog prvenstva.');
    }

    const totalCount = await CardTemplate.countDocuments({ event: eventId });

    const cardsWithFlag = await Promise.all(
      cards.map(async (card) => {
        card._id = card._id.toString();
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

        return {
          ...card,
          isCollected: !!userCard,
        };
      })
    );

    return {
      cards: cardsWithFlag,
      totalCount,
    };
  }

  public async getCardStats(userId: string) {
    const countOfAllCards = await CardTemplate.countDocuments();
    const album = await Album.findOne({
      owner: new Types.ObjectId(userId),
    });
    if (!album) {
      throw new NotFoundError('Album nije pronađen.');
    }
    const numberOfCollectedCards = album ? album.cards.length : 0;
    const percentageOfCollectedCards =
      countOfAllCards === 0
        ? 0
        : (numberOfCollectedCards / countOfAllCards) * 100;
    return {
      numberOfCollectedCards,
      percentageOfCollectedCards: Math.round(percentageOfCollectedCards),
      countOfAllCards,
    };
  }
}
