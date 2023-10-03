// Import necessary dependencies and models
import Question from '../models/Question';
import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import Quiz from '../models/Quiz';
import QuizResult from '../models/QuizResult';

@Service()
export class QuizService {
  public async getResolvedQuizzesWithResults(
    page: number,
    limit: number,
    userId: string
  ): Promise<any> {
    const skip = (page - 1) * limit;
    // Find quizzes that have corresponding quiz results for the user
    const resolvedQuizResults = await QuizResult.find({
      userId,
    })
      .sort({ dateTaken: -1 }) // Sort by most recent
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'quizId', // Populate the 'quizId' field
        model: 'Quiz', // Reference the Quiz model
        options: {
          lean: true, // Return plain JavaScript objects instead of Mongoose documents
        },
      })
      .lean();

    return resolvedQuizResults.map((resolvedQuizz: any) => {
      return {
        quiz: {
          _id: resolvedQuizz.quizId?._id.toString(),
          title: resolvedQuizz.quizId?.title,
          thumbnail: resolvedQuizz.quizId?.thumbnail,
        },
        score: resolvedQuizz.score,
        dateTaken: resolvedQuizz.dateTaken,
        duration: resolvedQuizz.duration,
      };
    });
  }

  public async getUnresolvedQuizzes(
    page: number,
    limit: number,
    userId: string,
    searchQuery?: string
  ): Promise<any[]> {
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
    const unresolvedQuizzes = await Quiz.find({
      _id: { $nin: resolvedQuizIds },
    })
      .sort({ createdAt: -1 }) // Sort by most recent
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'questions', // Populate the 'questions' field
        model: Question, // Reference the Question model
        options: {
          lean: true, // Return plain JavaScript objects instead of Mongoose documents
        },
      })
      .lean();

    const res = unresolvedQuizzes.map((unresolvedQuizz: any) => {
      const quizIdAsString = unresolvedQuizz._id.toString();
      return {
        ...unresolvedQuizz,
        _id: quizIdAsString,
      };
    });
    return res;
  }

  public async getRecentQuizzes(
    page: number,
    limit: number,
    userId: string,
    searchQuery?: string
  ) {
    // Calculate skip value based on the requested page and limit
    const skip = (page - 1) * limit;

    // Define the query object to filter by isExpired and optionally by name
    const query: any = { isExpired: false };

    if (searchQuery) {
      // If a searchQuery is provided, add a case-insensitive name search
      query.name = { $regex: new RegExp(searchQuery, 'i') };
    }

    // Query the database for recent quizzes with optional name search and pagination
    const quizzes = await Quiz.find(query)
      .sort({ createdAt: -1 }) // Sort by most recent
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'questions', // Populate the 'questions' field
        model: Question, // Reference the Question model
        options: {
          lean: true, // Return plain JavaScript objects instead of Mongoose documents
        },
      })
      .lean(); // Return plain JavaScript objects instead of Mongoose documents

    // Fetch resolved quizzes and their Quiz Results in parallel
    const resolvedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const quizIdAsString = quiz._id.toString();

        // Check if the quiz is resolved by the user
        const isQuizResolved = await QuizResult.findOne({
          userId,
          quiz: quizIdAsString,
        });

        const questionsModified = quiz.questions.map(
          (question: any) => ({
            ...question,
            _id: question._id.toString(),
          })
        );

        return {
          ...quiz,
          isQuizResolved: !!isQuizResolved,
          _id: quizIdAsString,
          questions: questionsModified,
        };
      })
    );

    // Filter other quizzes that are not resolved
    const otherQuizzes = resolvedQuizzes.filter(
      (quiz) => !quiz.isQuizResolved
    );

    return {
      resolvedQuizzes,
      otherQuizzes,
    };
  }

  async getQuizDetailsById(quizId: string) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new BadRequestError('Quiz not found');
    }
    return quiz.toObject();
  }
}
