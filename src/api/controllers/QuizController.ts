import { QuizService } from '../services/QuizService';
import {
  Authorized,
  BadRequestError,
  Body,
  CurrentUser,
  Delete,
  Get,
  InternalServerError,
  JsonController,
  NotFoundError,
  Param,
  Post,
  Put,
  QueryParam,
  Res,
} from 'routing-controllers';
import { UserType } from '../../types';
import { CreateQuizBody } from './requests/QuizRequests';
import { Response } from 'express';

@JsonController('/quizzes')
export default class QuizController {
  private quizService: QuizService;

  constructor() {
    this.quizService = new QuizService();
  }

  @Authorized()
  @Get('/unresolved')
  async getUnresolvedQuizzes(
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 5,
    @QueryParam('search') searchQuery?: string
  ) {
    const userId = user?._id;
    try {
      const quizzes = await this.quizService.getUnresolvedQuizzes(
        Number(page),
        Number(limit),
        userId,
        searchQuery
      );
      return quizzes;
    } catch (error: any) {
      console.error('Greška prilikom dohvaćanja neriješenih kvizova:', error);
      throw new InternalServerError(
        'Greška na serveru prilikom dohvaćanja kvizova.'
      );
    }
  }

  @Authorized()
  @Get('/resolved')
  async getResolvedQuizzes(
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 5
  ) {
    try {
      const userId = user?._id;
      const quizzes = await this.quizService.getResolvedQuizzesWithResults(
        Number(page),
        Number(limit),
        userId
      );
      return quizzes;
    } catch (error: any) {
      console.error('Greška prilikom dohvaćanja riješenih kvizova:', error);
      throw new InternalServerError(
        'Greška na serveru prilikom dohvaćanja kvizova.'
      );
    }
  }

  @Authorized()
  @Get('/all')
  public async getAllQuizzes() {
    try {
      const quizzes = await this.quizService.getAllQuizTitles();
      return quizzes;
    } catch (error: any) {
      console.error('An error occurred while fetching quiz titles:', error);
      let errorMessage = 'Internal server error';
      switch (error.message) {
        case 'DatabaseQueryFailed':
          errorMessage = 'Error fetching quizzes from the database';
          throw new InternalServerError(errorMessage);
        default:
          throw new InternalServerError(errorMessage);
      }
    }
  }

  @Authorized()
  @Get('/results')
  public async getBestQuizResults(
    @QueryParam('quizId') quizId: string,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ) {
    try {
      const result = await this.quizService.getBestQuizResults(
        quizId,
        Number(page),
        Number(limit)
      );
      return result;
    } catch (error: any) {
      if (error.message === 'NoQuizResultsFound') {
        throw new BadRequestError('No quiz results found.');
      } else {
        console.error('An error occurred while fetching quiz results:', error);
        throw new InternalServerError(
          'An error occurred while fetching quiz results.'
        );
      }
    }
  }

  @Authorized()
  @Get('/:quizId')
  async getQuizDetails(
    @Param('quizId') quizId: string,
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response
  ) {
    try {
      const userId = user._id;
      const quizDetails = await this.quizService.getQuizDetailsById(quizId);
      const quizStatus = await this.quizService.getQuizStatusByUserAndIds(
        userId,
        quizId
      );
      const isQuizzResolved = await this.quizService.checkIfQuizResolved(
        userId,
        quizId
      );
      const quizzAnswers = await this.quizService.getAnswers(userId, quizId);

      return res.json({
        ...quizDetails,
        status: quizStatus ? quizStatus : null,
        quizzAnswers: quizzAnswers ? quizzAnswers : null,
        isResolved: !!isQuizzResolved && !!isQuizzResolved.length,
      });
    } catch (error: any) {
      console.error('Error in getQuizDetails:', error.message);
      switch (error.message) {
        case 'QuizNotFound':
          throw new BadRequestError('Quiz not found');
        case 'DatabaseQueryFailed':
          throw new InternalServerError('Error querying the database');
        default:
          throw new InternalServerError('Internal server error');
      }
    }
  }

  @Post('/')
  public async submitQuizResult(
    @Body()
    {
      userId,
      quizId,
      score,
      duration,
    }: {
      userId: string;
      quizId: string;
      score: number;
      duration: number;
    }
  ) {
    try {
      const result = await this.quizService.submitQuizResult(
        userId,
        quizId,
        score,
        duration
      );
      return result;
    } catch (error: any) {
      console.error('Error in submitQuizResult:', error.message);
      switch (error.message) {
        case 'InvalidUserIdOrQuizId':
          throw new BadRequestError('Neispravni ID korisnika ili kviza!');
        case 'QuizNotFound':
          throw new BadRequestError('Kviz nije pronađen!');
        case 'DatabaseOperationFailed':
          throw new InternalServerError('Neuspješno slanje kviza!');
        default:
          throw new InternalServerError('Interna greška servera!');
      }
    }
  }

  @Authorized()
  @Post('/update-answer')
  async updateAnswer(
    @CurrentUser({ required: true }) user: UserType,
    @Body()
    {
      quizId,
      questionId,
      selectedOption,
      isCorrect,
    }: {
      quizId: string;
      questionId: string;
      selectedOption: number;
      isCorrect: boolean;
    },
    @Res() res: Response
  ) {
    const updatedAnswer = await this.quizService.updateQuizAnswer(
      user._id,
      quizId,
      questionId,
      selectedOption,
      isCorrect
    );
    return res.json(updatedAnswer);
  }

  @Authorized()
  @Post('/new')
  public async createQuizWithQuestions(
    @Body() createQuizBody: CreateQuizBody,
    @Res() res: Response
  ): Promise<any> {
    try {
      const result = await this.quizService.createQuizWithQuestions(
        createQuizBody
      );
      return res.json(result);
    } catch (error: any) {
      console.error('Error in createQuizWithQuestions:', error.message);
      switch (error.message) {
        case 'QuizAlreadyExists':
          throw new BadRequestError('Kviz s ovim naslovom već postoji!');
        case 'DatabaseOperationFailed':
          throw new InternalServerError('Neuspješno dodavanje novog kviza!');
        default:
          throw new InternalServerError('Interna greška servera!');
      }
    }
  }

  @Authorized()
  @Post('/:quizId/start')
  async startQuiz(
    @Param('quizId') quizId: string,
    @CurrentUser({ required: true }) user: UserType
  ) {
    try {
      const userId = user._id;
      await this.quizService.startQuizz(userId, quizId);

      return { message: 'Quiz started successfully.' };
    } catch (error: any) {
      console.error('Error in startQuiz:', error.message);
      switch (error.message) {
        case 'QuizAlreadyStartedOrCompleted':
          throw new BadRequestError('Kviz je već započet ili dovršen!');
        case 'DatabaseOperationFailed':
          throw new InternalServerError('Neuspješna promjena baze podataka!');
        default:
          throw new InternalServerError('Internal greška servera!');
      }
    }
  }

  @Authorized()
  @Put('/:quizId')
  async editQuiz(
    @Param('quizId') quizId: string,
    @Body() updatedQuizData: CreateQuizBody
  ) {
    try {
      const editedQuiz = await this.quizService.editQuiz(
        quizId,
        updatedQuizData
      );
      return editedQuiz;
    } catch (error: any) {
      console.error('Error in editQuiz:', error.message);
      switch (error.message) {
        case 'QuizNotFound':
          throw new BadRequestError('Kviz nije pronađen!');
        case 'QuestionNotFound':
          throw new BadRequestError(error.details);
        case 'DatabaseOperationFailed':
          throw new InternalServerError(
            'Promjena baze podataka je neuspješna!'
          );
        default:
          throw new InternalServerError('Interna greška servera!');
      }
    }
  }

  @Authorized()
  @Delete('/:quizId')
  async deleteQuiz(@Param('quizId') quizId: string) {
    try {
      await this.quizService.deleteQuiz(quizId);
      return { message: 'Quiz deleted successfully' };
    } catch (error: any) {
      console.error('Error in deleteQuiz:', error.message);
      switch (error.message) {
        case 'QuizNotFound':
          throw new BadRequestError('Quiz not found');
        case 'DatabaseOperationFailed':
          throw new InternalServerError('Database operation failed');
        default:
          throw new InternalServerError('Internal server error');
      }
    }
  }
}
