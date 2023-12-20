import Question from '../models/Question';
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from 'routing-controllers';
import { Service } from 'typedi';
import Quiz from '../models/Quiz';
import QuizResult from '../models/QuizResult';
import QuizStatus from '../models/QuizStatus';
import UserQuizzAnswer from '../models/UserQuizzAnswer';
import mongoose from 'mongoose';
import {
  CreateQuestionBody,
  CreateQuizBody,
} from '../controllers/requests/QuizRequests';

@Service()
export class QuizService {
  public async getResolvedQuizzesWithResults(
    page: number,
    limit: number,
    userId: string
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const pipeline: any[] = [
      {
        $match: { userId },
      },
      {
        $sort: { dateTaken: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quizId',
          foreignField: '_id',
          as: 'quiz',
        },
      },
      {
        $unwind: '$quiz',
      },
      {
        $project: {
          _id: 0,
          quiz: {
            _id: '$quiz._id',
            title: '$quiz.title',
            thumbnail: '$quiz.thumbnail',
          },
          score: 1,
          dateTaken: 1,
          duration: 1,
        },
      },
    ];
    const [resolvedQuizzes, totalCount] = await Promise.all([
      QuizResult.aggregate(pipeline),
      QuizResult.countDocuments({ userId }),
    ]);

    return {
      count: totalCount,
      resolvedQuizzes,
    };
  }

  public async getUnresolvedQuizzes(
    page: number,
    limit: number,
    userId: string,
    searchQuery?: string
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const query: any = { isExpired: false };
    if (searchQuery) {
      query.title = { $regex: new RegExp(searchQuery, 'i') };
    }
    const resolvedQuizResults = await QuizResult.find({
      userId,
    }).lean();
    const resolvedQuizIds = resolvedQuizResults.map(
      (result: any) => result.quizId
    );
    const today = new Date();
    const [unresolvedQuizzes, totalCount] = await Promise.all([
      Quiz.find({
        _id: { $nin: resolvedQuizIds },
        availableUntil: { $gte: today },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title thumbnail availableUntil createdAt')
        .lean(),
      Quiz.countDocuments({
        _id: { $nin: resolvedQuizIds },
        availableUntil: { $gte: today },
      }),
    ]);
    const formattedQuizzes = [];
    for (const unresolvedQuiz of unresolvedQuizzes) {
      const status = await QuizStatus.find({
        quizId: unresolvedQuiz._id,
        userId,
      });
      const formatted = {
        _id: unresolvedQuiz._id.toString(),
        title: unresolvedQuiz.title,
        thumbnail: unresolvedQuiz.thumbnail,
        availableUntil: unresolvedQuiz.availableUntil,
        createdAt: unresolvedQuiz.createdAt,
        status,
      };
      formattedQuizzes.push(formatted);
    }

    return {
      count: totalCount,
      unresolvedQuizzes: formattedQuizzes,
    };
  }

  public async getRecentQuizzes(userId: string) {
    const resolvedQuizResults = await QuizResult.find({ userId }).lean();
    const resolvedQuizIds = resolvedQuizResults.map(
      (result: any) => result.quizId
    );

    const quizzes = await Quiz.find({
      _id: { $nin: resolvedQuizIds },
      availableUntil: { $gte: new Date() },
    })
      .sort({ createdAt: -1 })
      .select('_id title thumbnail availableUntil createdAt')
      .limit(2)
      .lean();

    const formattedQuizzes = [];
    for (const quiz of quizzes) {
      const statuses = await QuizStatus.find({ quizId: quiz._id, userId })
        .sort({ createdAt: -1 })
        .lean();

      const formattedQuiz = {
        ...quiz,
        _id: quiz._id.toString(),
        status: statuses.map((status) => ({
          _id: status._id.toString(),
          userId: status.userId.toString(),
          quizId: status.quizId.toString(),
          status: status.status,
          startTime: status.startTime,
          __v: status.__v,
        })),
      };
      formattedQuizzes.push(formattedQuiz);
    }

    return formattedQuizzes;
  }

  public async submitQuizResult(
    userId: string,
    quizId: string,
    score: number,
    duration: number
  ) {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(quizId)
      ) {
        throw new BadRequestError('Nevažeći userId ili quizId');
      }
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        throw new NotFoundError('Kviz nije pronađen');
      }

      const quizResult = new QuizResult({
        userId,
        quizId,
        score,
        duration,
      });

      await QuizStatus.deleteOne({ userId, quizId });
      await UserQuizzAnswer.deleteMany({ userId, quizId });
      await quizResult.save();

      return { message: 'Rezultat kvia uspješno poslan.' };
    } catch (error) {
      console.error(error);
      throw new InternalServerError('Interna greška servera.');
    }
  }

  public async getQuizDetailsById(quizId: string) {
    const quiz = await Quiz.findById(quizId).populate('questions').lean();
    if (!quiz) {
      throw new NotFoundError('Kviz nije pronađen.');
    }
    return {
      ...quiz,
      _id: quiz._id.toString(),
      questions: quiz.questions
        ? quiz.questions.map((question: any) => {
            return {
              ...question,
              _id: question._id.toString(),
            };
          })
        : null,
    };
  }

  public async findQuizById(quizId: string) {
    const quiz = await Quiz.findById(quizId);
    return quiz;
  }

  public async createQuizWithQuestions(
    createQuizDto: CreateQuizBody
  ): Promise<any> {
    const existingQuiz = await Quiz.findOne({
      title: createQuizDto.title,
    }).exec();

    if (existingQuiz) {
      throw new BadRequestError('Kviz s ovim naslovom već postoji.');
    }
    const questionsData: CreateQuestionBody[] = createQuizDto.questions;
    const questions = await Question.insertMany(questionsData);
    const quizData = {
      title: createQuizDto.title,
      description: createQuizDto.description,
      thumbnail: createQuizDto.thumbnail,
      questions: questions.map((q) => q._id),
      isExpired: false,
      availableUntil: new Date(createQuizDto.availableUntil),
      createdAt: new Date(),
    };
    const quiz = new Quiz(quizData);
    const result = await quiz.save();
    return {
      ...result.toObject(),
      _id: result._id.toString(),
    };
  }

  public async editQuiz(
    quizId: string,
    updateQuizDto: CreateQuizBody
  ): Promise<any> {
    const existingQuiz = await Quiz.findById({ _id: quizId }).exec();
    if (!existingQuiz) {
      throw new NotFoundError('Kviz nije pronađen.');
    }
    existingQuiz.title = updateQuizDto.title || existingQuiz.title;
    existingQuiz.description =
      updateQuizDto.description || existingQuiz.description;
    existingQuiz.thumbnail = updateQuizDto.thumbnail || existingQuiz.thumbnail;
    existingQuiz.availableUntil =
      new Date(updateQuizDto.availableUntil) || existingQuiz.availableUntil;
    const updatedQuestionIds: any[] = [];
    for (const questionDto of updateQuizDto.questions) {
      if (questionDto._id) {
        const existingQuestion = await Question.findById(
          questionDto._id
        ).exec();
        if (!existingQuestion) {
          throw new NotFoundError('Pitanje nije pronađeno.');
        }
        existingQuestion.text = questionDto.text || existingQuestion.text;
        existingQuestion.options =
          questionDto.options || existingQuestion.options;
        existingQuestion.correctOption =
          questionDto.correctOption || existingQuestion.correctOption;
        existingQuestion.image = questionDto.image || existingQuestion.image;
        await existingQuestion.save();
        updatedQuestionIds.push(existingQuestion._id);
      } else {
        const newQuestion = new Question(questionDto);
        await newQuestion.save();
        updatedQuestionIds.push(newQuestion._id);
      }
    }
    existingQuiz.questions = updatedQuestionIds;
    await existingQuiz.save();
    return {
      ...existingQuiz.toObject(),
      _id: existingQuiz._id.toString(),
    };
  }

  public async getBestQuizResults(
    quizId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const query = { quizId };
    const quizResults = await QuizResult.find(query)
      .sort({ score: -1, duration: 1 })
      .skip(skip)
      .lean()
      .limit(limit)
      .populate('userId')
      .exec();
    const total = await QuizResult.countDocuments(query);

    return {
      quizResults,
      count: total,
    };
  }

  public async getAllQuizTitles() {
    const quizzes = await Quiz.find({}, 'title').exec();
    return quizzes;
  }

  public async getQuizStatusByUserAndIds(userId: string, quizId: string) {
    const statuses = await QuizStatus.findOne({
      userId,
      quizId,
    }).lean();
    return statuses;
  }

  public async checkIfQuizResolved(userId: string, quizId: string) {
    const results = await QuizResult.find({
      userId,
      quizId,
    }).exec();
    return results;
  }

  public async startQuiz(userId: string, quizId: string) {
    const existingStatus = await QuizStatus.findOne({
      userId,
      quizId,
    });
    if (existingStatus && existingStatus.status !== 'notStarted') {
      throw new BadRequestError('Kviz je već započet ili je već riješen.');
    }
    const status = {
      userId,
      quizId,
      status: 'inProgress',
      startTime: new Date(),
    };

    await QuizStatus.create(status);
  }

  public async updateQuizAnswer(
    userId: string,
    quizId: string,
    questionId: string,
    selectedOption: number,
    isCorrect: boolean
  ) {
    const existingStatus = await QuizStatus.findOne({
      userId,
      quizId,
    });
    if (!existingStatus) {
      throw new BadRequestError('Kviz nije započet.');
    }
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Kviz nije pronađen.');
    }
    const questionsOfQuizz = quiz.questions.map((question) =>
      question.toString()
    );
    const questionIsInQuizz =
      questionsOfQuizz && questionsOfQuizz.includes(questionId);
    if (!questionIsInQuizz) {
      throw new NotFoundError('Pitanje nije pronađeno u kvizu.');
    }
    const answer = await UserQuizzAnswer.findOneAndUpdate(
      { userId, quizId, questionId },
      { selectedOption, isCorrect },
      { upsert: true, new: true }
    );

    return answer;
  }

  public async getAnswers(userId: string, quizId: string) {
    const answers = await UserQuizzAnswer.find({ userId, quizId });
    return answers;
  }

  public async deleteQuiz(quizId: string): Promise<void> {
    const existingQuiz = await Quiz.findById(quizId);
    if (!existingQuiz) {
      throw new NotFoundError('Kviz nije pronađen.');
    }
    await Question.deleteMany({
      _id: { $in: existingQuiz.questions },
    });
    await Quiz.findByIdAndDelete(quizId);
  }
}
