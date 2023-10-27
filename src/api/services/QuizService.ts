// Import necessary dependencies and models
import Question from '../models/Question';
import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import Quiz from '../models/Quiz';
import QuizResult from '../models/QuizResult';
import QuizStatus from '../models/QuizStatus';
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

      // Delete the QuizStatus document for this user and quiz
      await QuizStatus.deleteOne({ userId, quizId });

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
      questions: quiz.questions
        ? quiz?.questions.map((question: any) => {
            return {
              ...question,
              _id: question._id.toString(),
            };
          })
        : null,
    };
  }
  public async createQuizWithQuestions(
    createQuizDto: CreateQuizBody
  ): Promise<any> {
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
    // Find the existing quiz by ID
    const existingQuiz = await Quiz.findById({ _id: quizId }).exec();

    if (!existingQuiz) {
      throw new BadRequestError('Quiz not found.');
    }

    existingQuiz.title = updateQuizDto.title || existingQuiz.title;
    existingQuiz.description =
      updateQuizDto.description || existingQuiz.description;
    existingQuiz.thumbnail =
      updateQuizDto.thumbnail || existingQuiz.thumbnail;
    existingQuiz.availableUntil =
      new Date(updateQuizDto.availableUntil) ||
      existingQuiz.availableUntil;

    // Updating Questions
    const updatedQuestionIds: any[] = [];
    for (const questionDto of updateQuizDto.questions) {
      if (questionDto._id) {
        // If question ID exists, update the existing question
        const existingQuestion = await Question.findById(
          questionDto._id
        ).exec();

        if (!existingQuestion) {
          throw new BadRequestError(
            `Question with ID ${questionDto._id} not found.`
          );
        }
        existingQuestion.text =
          questionDto.text || existingQuestion.text;
        existingQuestion.options =
          questionDto.options || existingQuestion.options;
        existingQuestion.correctOption =
          questionDto.correctOption || existingQuestion.correctOption;
        existingQuestion.image =
          questionDto.image || existingQuestion.image;
        await existingQuestion.save();

        updatedQuestionIds.push(existingQuestion._id);
      } else {
        // Else create a new question
        const newQuestion = new Question(questionDto);
        await newQuestion.save();
        updatedQuestionIds.push(newQuestion._id);
      }
    }

    // Update the quiz's question list
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
      .limit(limit)
      .populate('userId') // replace 'username' with actual user fields you'd like to display
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

  public async getQuizStatusByUserAndIs(
    userId: string,
    quizId: string
  ) {
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

  public async startQuizz(userId: string, quizId: string) {
    const existingStatus = await QuizStatus.findOne({
      userId,
      quizId,
    });

    if (existingStatus && existingStatus.status !== 'notStarted') {
      throw new BadRequestError('Quiz already started or completed.');
    }

    const status = {
      userId,
      quizId,
      status: 'inProgress',
      startTime: new Date(),
    };

    await QuizStatus.create(status);
  }

  public async deleteQuiz(quizId: string): Promise<void> {
    // Find the quiz by ID
    const existingQuiz = await Quiz.findById(quizId);

    if (!existingQuiz) {
      throw new BadRequestError('Quiz not found');
    }

    // Delete questions related to the quiz
    await Question.deleteMany({
      _id: { $in: existingQuiz.questions },
    });

    // Delete the quiz itself
    await Quiz.findByIdAndDelete(quizId);
  }
}
