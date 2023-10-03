import { QuizService } from '../services/QuizService';
import {
  Authorized,
  BadRequestError,
  CurrentUser,
  Get,
  JsonController,
  Param,
  QueryParam,
} from 'routing-controllers';
import { UserType } from '../../types';

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
      page,
      limit,
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
        page,
        limit,
        userId
      );
    return quizzes;
  }

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
}
