import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from 'routing-controllers';
import Album from '../models/Album';
import { Types } from 'mongoose';
import CardTemplate from '../models/CardTemplate';
import PrintedCard from '../models/PrintedCard';
import UserCard, { IUserCard } from '../models/UserCard';

export class CardService {
  public async getCardWithEventDetails(cardId: string) {
    const card = await CardTemplate.findById(cardId)
      .populate('event')
      .lean();
    if (!card) {
      throw new NotFoundError('Sličica nije pronađena.');
    }
    return card;
  }

  public async getCardDetails(
    printedCardId: string,
    userId?: string
  ) {
    const printedCard = await PrintedCard.findById(printedCardId);

    if (!printedCard) {
      throw new NotFoundError(
        'Sličica nije pronađena ili je već skenirana.'
      );
    }

    const cardTemplate = await CardTemplate.findOne({
      _id: printedCard.cardTemplate,
    })
      .populate('event')
      .lean();

    if (!cardTemplate) {
      throw new NotFoundError('Sličica nije nađena.');
    }

    const formId = cardTemplate.formId;
    if (!!userId && formId && cardTemplate.form !== '1/1') {
      const cardTemplates = await CardTemplate.find({
        formId,
      })
        .populate('event')
        .lean();

      if (!cardTemplates) {
        throw new NotFoundError('Sličice nisu pronađene.');
      }
      const templatesRes = [];
      for (const ct of cardTemplates) {
        const userCard = await UserCard.findOne({
          userId,
          cardTemplateId: ct._id,
        });
        let template = {
          ...ct,
          isCollected: !!userCard,
        };
        templatesRes.push(template);
      }
      return templatesRes;
    }
    return {
      ...cardTemplate,
      isScanned: printedCard.isScanned,
      printedCardId: printedCardId,
    };
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
      throw new BadRequestError(
        'Sličica je već dodana u digitalni Almanah.'
      );
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
  }

  public async getAllCardsFromAlbum(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const album = await Album.findOne({ owner: userId }).populate({
      path: 'cards',
      populate: [
        { path: 'printedCardId' },
        { path: 'cardTemplateId' },
      ],
    });

    if (!album) {
      throw new NotFoundError('Album nije pronađen.');
    }

    const userCards = album.cards.map(
      (card) => card as any
    ) as IUserCard[];

    const cardsData = await Promise.all(
      userCards.slice(skip, skip + limit).map(async (uc) => {
        const cardTemplate = uc.cardTemplateId as any;
        const printedCardId = uc.printedCardId as any;
        const isCollected = await UserCard.exists({
          userId: new Types.ObjectId(userId),
          printedCardId: printedCardId._id,
        });

        return {
          ...cardTemplate._doc,
          printedCardId: printedCardId
            ? printedCardId._id.toString()
            : null,
          isCollected: !!isCollected,
        };
      })
    );

    const totalCount = userCards.length;

    return {
      cards: cardsData,
      totalCount,
    };
  }
  public async getRecentCardsFromAlbum(userId: string) {
    const album = await Album.findOne({ owner: userId }).populate({
      path: 'cards',
      populate: [
        { path: 'printedCardId' },
        { path: 'cardTemplateId' },
      ],
    });

    if (!album) {
      throw new NotFoundError('Album nije pronađen.');
    }

    const userCards = album.cards.map(
      (card) => card as any
    ) as IUserCard[];

    const cardsData = await Promise.all(
      userCards.map(async (uc) => {
        const cardTemplate = uc.cardTemplateId as any;
        const printedCardId = uc.printedCardId as any;
        const isCollected = await UserCard.exists({
          userId: new Types.ObjectId(userId),
          printedCardId: printedCardId._id,
        });

        return {
          ...cardTemplate._doc,
          printedCardId: printedCardId
            ? printedCardId._id.toString()
            : null,
          isCollected: !!isCollected,
        };
      })
    );

    return cardsData.slice(0, 8);
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
    const cardsWithFlag = await Promise.all(
      cards.map(async (card) => {
        const cardObj: any = card.toObject();
        cardObj._id = card._id.toString();
        // check if there is a matching printed card for the card template
        const printedCard = await PrintedCard.findOne({
          cardTemplate: card._id,
          isScanned: true,
          owner: userId,
        });

        // check if the user has collected the printed card
        const userCard = printedCard
          ? await UserCard.findOne({
              printedCardId: printedCard._id,
              userId,
            })
          : null;

        //@ts-ignore
        cardObj.isCollected = !!userCard;
        cardObj.printedCardId =
          !!userCard && printedCard
            ? printedCard._id?.toString()
            : null;
        return cardObj;
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
      percentageOfCollectedCards: Math.round(
        percentageOfCollectedCards
      ),
      countOfAllCards,
    };
  }
}
