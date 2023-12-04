import Question from '../models/Question';
import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import Quiz from '../models/Quiz';
import QuizResult from '../models/QuizResult';
import QuizStatus from '../models/QuizStatus';
import UserQuizzAnswer from '../models/UserQuizzAnswer';
import mongoose, { Types } from 'mongoose';

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
    try {
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
      if (!resolvedQuizzes || resolvedQuizzes.length === 0) {
        return { count: 0, resolvedQuizzes: [] };
      }
      return {
        count: totalCount,
        resolvedQuizzes,
      };
    } catch (error: any) {
      console.error(
        `Error in getResolvedQuizzesWithResults: ${error.message}`,
        error
      );
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async getUnresolvedQuizzes(
    page: number,
    limit: number,
    userId: string,
    searchQuery?: string
  ): Promise<any> {
    try {
      const skip = (page - 1) * limit;
      const query: any = { isExpired: false };
      if (searchQuery) {
        query.title = { $regex: new RegExp(searchQuery, 'i') };
      }
      const resolvedQuizResults = await QuizResult.find({ userId }).lean();
      const resolvedQuizIds = resolvedQuizResults.map(
        (result) => result.quizId
      );
      const today = new Date();
      const [unresolvedQuizzes, totalCount] = await Promise.all([
        Quiz.find({
          ...query,
          _id: { $nin: resolvedQuizIds },
          availableUntil: { $gte: today },
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('title thumbnail availableUntil createdAt')
          .lean(),
        Quiz.countDocuments({
          ...query,
          _id: { $nin: resolvedQuizIds },
          availableUntil: { $gte: today },
        }),
      ]);
      if (!unresolvedQuizzes || unresolvedQuizzes.length === 0) {
        return { count: 0, unresolvedQuizzes: [] };
      }
      const formattedQuizzes = unresolvedQuizzes.map((unresolvedQuiz) => ({
        _id: unresolvedQuiz._id.toString(),
        title: unresolvedQuiz.title,
        thumbnail: unresolvedQuiz.thumbnail,
        availableUntil: unresolvedQuiz.availableUntil,
        createdAt: unresolvedQuiz.createdAt,
      }));
      return {
        count: totalCount,
        unresolvedQuizzes: formattedQuizzes,
      };
    } catch (error: any) {
      console.error(`Error in getUnresolvedQuizzes: ${error.message}`, error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async getRecentQuizzes(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('InvalidUserID');
    }
    try {
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

      if (!quizzes || quizzes.length === 0) {
        return [];
      }
      return quizzes;
    } catch (error: any) {
      console.error(`Error fetching recent quizzes for user: ${userId}`, error);
      throw new Error('DatabaseQueryFailed');
    }
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
        throw new Error('InvalidUserIdOrQuizId');
      }

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        throw new Error('QuizNotFound');
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

      return { message: 'QuizResult submitted successfully' };
    } catch (error) {
      console.error('Error in submitQuizResult:', error);
      throw new Error('DatabaseOperationFailed');
    }
  }

  public async getQuizDetailsById(quizId: string) {
    try {
      const quiz = await Quiz.findById(quizId).populate('questions').lean();
      if (!quiz) {
        throw new Error('QuizNotFound');
      }
      return {
        ...quiz,
        _id: quiz._id.toString(),
        questions: quiz.questions
          ? quiz.questions.map((question: any) => ({
              ...question,
              _id: question._id.toString(),
            }))
          : null,
      };
    } catch (error) {
      console.error('Error in getQuizDetailsById:', error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async createQuizWithQuestions(
    createQuizDto: CreateQuizBody
  ): Promise<any> {
    try {
      const existingQuiz = await Quiz.findOne({
        title: createQuizDto.title,
      }).exec();
      if (existingQuiz) {
        throw new Error('QuizAlreadyExists');
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
    } catch (error) {
      console.error('Error in createQuizWithQuestions:', error);
      throw new Error('DatabaseOperationFailed');
    }
  }

  public async editQuiz(
    quizId: string,
    updateQuizDto: CreateQuizBody
  ): Promise<any> {
    try {
      const existingQuiz = await Quiz.findById({ _id: quizId }).exec();
      if (!existingQuiz) {
        throw new Error('QuizNotFound');
      }
      existingQuiz.title = updateQuizDto.title || existingQuiz.title;
      existingQuiz.description =
        updateQuizDto.description || existingQuiz.description;
      existingQuiz.thumbnail =
        updateQuizDto.thumbnail || existingQuiz.thumbnail;
      existingQuiz.availableUntil =
        new Date(updateQuizDto.availableUntil) || existingQuiz.availableUntil;

      const updatedQuestionIds: any[] = [];
      for (const questionDto of updateQuizDto.questions) {
        if (questionDto._id) {
          const existingQuestion = await Question.findById(
            questionDto._id
          ).exec();
          if (!existingQuestion) {
            const error = new Error('QuestionNotFound');
            throw error;
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
    } catch (error) {
      console.error('Error in editQuiz:', error);
      throw new Error('DatabaseOperationFailed');
    }
  }

  public async getBestQuizResults(
    quizId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const query = { quizId };
    try {
      const quizResults = await QuizResult.find(query)
        .sort({ score: -1, duration: 1 })
        .skip(skip)
        .limit(limit)
        .populate('userId')
        .exec();
      if (!quizResults || quizResults.length === 0) {
        throw new Error('NoQuizResultsFound');
      }
      const total = await QuizResult.countDocuments(query);
      return {
        quizResults,
        count: total,
      };
    } catch (error) {
      throw error;
    }
  }

  public async getAllQuizTitles() {
    try {
      const quizzes = await Quiz.find({}, 'title').lean();
      return quizzes.map((quiz) => quiz.title);
    } catch (error) {
      console.error('An error occurred while fetching quiz titles:', error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async getQuizStatusByUserAndIds(userId: string, quizId: string) {
    try {
      const statuses = await QuizStatus.findOne({ userId, quizId }).lean();
      return statuses;
    } catch (error) {
      console.error('Error in getQuizStatusByUserAndIs:', error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async checkIfQuizResolved(userId: string, quizId: string) {
    try {
      const results = await QuizResult.find({ userId, quizId }).exec();
      return results;
    } catch (error) {
      console.error('Error in checkIfQuizResolved:', error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async startQuizz(userId: string, quizId: string) {
    try {
      const existingStatus = await QuizStatus.findOne({ userId, quizId });
      if (existingStatus && existingStatus.status !== 'notStarted') {
        throw new Error('QuizAlreadyStartedOrCompleted');
      }
      const status = {
        userId,
        quizId,
        status: 'inProgress',
        startTime: new Date(),
      };
      await QuizStatus.create(status);
    } catch (error) {
      console.error('Error in startQuizz:', error);
      throw new Error('DatabaseOperationFailed');
    }
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
      throw new BadRequestError('This quiz is not in progress');
    }
    const quizz = await Quiz.findById(quizId);
    if (!existingStatus) {
      throw new BadRequestError('This quiz is not found');
    }
    const questionsOfQuizz = quizz?.questions.map((question) =>
      question.toString()
    );
    const questionIsInQuizz =
      questionsOfQuizz && questionsOfQuizz.includes(questionId);
    if (!questionIsInQuizz) {
      throw new BadRequestError('This question is not found in that quizz');
    }
    const answer = await UserQuizzAnswer.findOneAndUpdate(
      { userId, quizId, questionId },
      { selectedOption, isCorrect },
      { upsert: true, new: true }
    );
    return answer;
  }

  public async getAnswers(userId: string, quizId: string) {
    try {
      const answers = await UserQuizzAnswer.find({ userId, quizId });
      return answers;
    } catch (error) {
      console.error('Error in getAnswers:', error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async deleteQuiz(quizId: string): Promise<void> {
    try {
      const existingQuiz = await Quiz.findById(quizId);
      if (!existingQuiz) {
        throw new Error('QuizNotFound');
      }
      await Question.deleteMany({ _id: { $in: existingQuiz.questions } });
      await Quiz.findByIdAndDelete(quizId);
    } catch (error) {
      console.error('Error in deleteQuiz:', error);
      throw new Error('DatabaseOperationFailed');
    }
  }
}
