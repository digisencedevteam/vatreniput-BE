import { QuizService } from '../services/QuizService';
import {
  Authorized,
  BadRequestError,
  Body,
  CurrentUser,
  Delete,
  Get,
  JsonController,
  Param,
  Post,
  Put,
  QueryParam,
  Res,
} from 'routing-controllers';
import { UserType } from '../../types';
import { CreateQuizBody } from './requests/QuizRequests';
import { validate } from 'class-validator';
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
    const quizzes = await this.quizService.getUnresolvedQuizzes(
      Number(page),
      Number(limit),
      userId,
      searchQuery
    );
    return quizzes;
  }

  @Authorized()
  @Get('/resolved')
  async getResolvedQuizzes(
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 5
  ) {
    const userId = user?._id;
    const quizzes =
      await this.quizService.getResolvedQuizzesWithResults(
        Number(page),
        Number(limit),
        userId
      );
    return quizzes;
  }

  @Authorized()
  @Get('/all')
  public async getAllQuizzes(@Res() res: Response) {
    try {
      const quizzes = await this.quizService.getAllQuizTitles();
      return res.status(200).json(quizzes);
    } catch (error) {
      return res.status(500).json({
        error: 'An error occurred while fetching quiz titles.',
      });
    }
  }

  @Authorized()
  @Get('/results')
  public async getBestQuizResults(
    @QueryParam('quizId') quizId: string,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10,
    @Res() res: Response
  ) {
    try {
      const result = await this.quizService.getBestQuizResults(
        quizId,
        Number(page),
        Number(limit)
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        error: 'An error occurred while fetching quiz results.',
      });
    }
  }

  @Authorized()
  @Get('/:quizId')
  async getQuizDetails(@Param('quizId') quizId: string) {
    const quizDetails = await this.quizService.getQuizDetailsById(
      quizId
    );

    if (!quizDetails) {
      throw new BadRequestError('Quiz not found');
    }
    return quizDetails;
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
    const result = await this.quizService.submitQuizResult(
      userId,
      quizId,
      score,
      duration
    );
    return result;
  }

  @Authorized()
  @Post('/new')
  public async createQuizWithQuestions(
    @Body() createQuizBody: CreateQuizBody,
    @Res() res: Response
  ): Promise<any> {
    // TODO: fix this
    // const errors = await validate(createQuizBody, {
    //   validationError: { target: false },
    // });
    // if (errors.length > 0) {
    //   console.log(errors, 'EROROROROOROR');

    //   throw new BadRequestError(errors.join(','));
    // }
    return await this.quizService.createQuizWithQuestions(
      createQuizBody
    );
  }

  @Authorized()
  @Put('/:quizId')
  async editQuiz(
    @Param('quizId') quizId: string,
    @Body() updatedQuizData: CreateQuizBody
  ) {
    const editedQuiz = await this.quizService.editQuiz(
      quizId,
      updatedQuizData
    );
    return editedQuiz;
  }

  @Authorized()
  @Delete('/:quizId')
  async deleteQuiz(@Param('quizId') quizId: string) {
    await this.quizService.deleteQuiz(quizId);
    return { message: 'Quiz deleted successfully' };
  }
}
