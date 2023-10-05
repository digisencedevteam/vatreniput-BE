// Import necessary dependencies and models
import Question from '../models/Question';
import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import Quiz from '../models/Quiz';
import QuizResult from '../models/QuizResult';
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

    // Specify the type of the pipeline explicitly
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
          from: 'quizzes', // Your Quiz model collection name
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
      count: totalCount, // Total count of resolved quizzes
      resolvedQuizzes, // Array of resolved quizzes
    };
  }

  public async getUnresolvedQuizzes(
    page: number,
    limit: number,
    userId: string,
    searchQuery?: string
  ): Promise<any> {
    // Calculate skip value based on the requested page and limit
    const skip = (page - 1) * limit;

    // Define the query object to filter by isExpired and optionally by name
    const query: any = { isExpired: false };

    if (searchQuery) {
      // If a searchQuery is provided, add a case-insensitive name search
      query.title = { $regex: new RegExp(searchQuery, 'i') };
    }

    // Find quizzes that do not have corresponding quiz results for the user
    const resolvedQuizResults = await QuizResult.find({
      userId,
    }).lean();
    const resolvedQuizIds = resolvedQuizResults.map(
      (result: any) => result.quizId
    );
    const today = new Date();
    // Find unresolved quizzes and get the total count
    const [unresolvedQuizzes, totalCount] = await Promise.all([
      Quiz.find({
        _id: { $nin: resolvedQuizIds },
        availableUntil: { $gte: today }, // Filter out quizzes where availableUntil is greater than or equal to today's date
      })
        .sort({ createdAt: -1 }) // Sort by most recent
        .skip(skip)
        .limit(limit)
        .select('title thumbnail availableUntil')
        .lean(),
      Quiz.countDocuments({
        _id: { $nin: resolvedQuizIds },
        availableUntil: { $gte: today }, // Filter out quizzes where availableUntil is greater than or equal to today's date
      }),
    ]);
    // Format the quiz data
    const formattedQuizzes = unresolvedQuizzes.map(
      (unresolvedQuizz: any) => ({
        _id: unresolvedQuizz._id.toString(),
        title: unresolvedQuizz.title,
        thumbnail: unresolvedQuizz.thumbnail,
        availableUntil: unresolvedQuizz.availableUntil,
      })
    );

    return {
      count: totalCount, // Total count of unresolved quizzes
      unresolvedQuizzes: formattedQuizzes, // Array of unresolved quizzes
    };
  }

  public async submitQuizResult(
    userId: string,
    quizId: string,
    score: number,
    duration: number
  ) {
    try {
      // Ensure that the userId and quizId are valid ObjectId strings
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(quizId)
      ) {
        throw new Error('Invalid userId or quizId');
      }

      // Check if the quiz exists
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Create a new QuizResult document
      const quizResult = new QuizResult({
        userId,
        quizId,
        score,
        duration,
      });

      // Save the QuizResult to the database
      await quizResult.save();

      return { message: 'QuizResult submitted successfully' };
    } catch (error) {
      console.error(error);
      throw new Error('Internal Server Error');
    }
  }

  public async getQuizDetailsById(quizId: string) {
    const quiz = await Quiz.findById(quizId)
      .populate('questions')
      .lean();
    if (!quiz) {
      throw new BadRequestError('Quiz not found');
    }
    return {
      ...quiz,
      _id: quiz._id.toString(),
    };
  }
  public async createQuizWithQuestions(
    createQuizDto: CreateQuizBody
  ): Promise<typeof Quiz> {
    const existingQuiz = await Quiz.findOne({
      title: createQuizDto.title,
    }).exec();

    if (existingQuiz) {
      // A quiz with the same title already exists
      throw new BadRequestError(
        'A quiz with this title already exists.'
      );
    }

    const questionsData: CreateQuestionBody[] =
      createQuizDto.questions;
    const questions = await Question.insertMany(questionsData);

    const quizData = {
      title: createQuizDto.title,
      description: createQuizDto.description,
      thumbnail: createQuizDto.thumbnail,
      questions: questions.map((q) => q._id),
      isExpired: false,
      createdAt: new Date(),
    };

    const quiz = new Quiz(quizData);
    await quiz.save();
    return quiz.toObject();
  }
}
