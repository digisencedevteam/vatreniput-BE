import { QuizService } from '../services/QuizService';
import {
  Authorized,
  BadRequestError,
  Body,
  CurrentUser,
  Delete,
  Get,
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
import { UserService } from '../services/UserService';

@JsonController('/quizzes')
export default class QuizController {
  private quizService: QuizService;
  private userService: UserService;

  constructor() {
    this.quizService = new QuizService();
    this.userService = new UserService();
  }

  @Authorized()
  @Get('/unresolved')
  async getUnresolvedQuizzes(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 5,
    @QueryParam('search') searchQuery?: string
  ) {
    const foundUser = this.userService.findOneById(user._id);
    if (!foundUser) {
      throw new NotFoundError('Korisnik nije pronađen.');
    }
    const userId = user._id;
    const quizzes = await this.quizService.getUnresolvedQuizzes(
      Number(page),
      Number(limit),
      userId,
      searchQuery
    );

    return res.json(quizzes);
  }

  @Authorized()
  @Get('/resolved')
  async getResolvedQuizzes(
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 5
  ) {
    const foundUser = this.userService.findOneById(user._id);
    if (!foundUser) {
      throw new NotFoundError('Korisnik nije pronađen.');
    }
    const userId = user._id;
    const quizzes = await this.quizService.getResolvedQuizzesWithResults(
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
      if (!quizzes) {
        throw new NotFoundError('Kvizovi nisu pronađeni.');
      }
      return res.json(quizzes);
    } catch (error) {
      throw new BadRequestError('Interna greška servera.');
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
    if (!quizId) {
      throw new BadRequestError('Nedostaje ID kviza.');
    }
    const result = await this.quizService.getBestQuizResults(
      quizId,
      Number(page),
      Number(limit)
    );

    return res.status(200).json(result);
  }

  @Authorized()
  @Get('/:quizId')
  async getQuizDetails(
    @Param('quizId') quizId: string,
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response
  ) {
    if (!quizId) {
      throw new BadRequestError('Nedostaje ID kviza.');
    }
    const userId = user._id;
    const quizDetails = await this.quizService.getQuizDetailsById(quizId);
    const quizStatus = await this.quizService.getQuizStatusByUserAndIds(
      userId,
      quizId
    );
    if (!quizDetails) {
      throw new NotFoundError('Kviz nije pronađen.');
    }
    const isQuizzResolved = await this.quizService.checkIfQuizResolved(
      userId,
      quizId
    );
    const quizzAnswers = await this.quizService.getAnswers(userId, quizId);
    if (!quizzAnswers) {
      throw new NotFoundError('Odgovori kviza nisu pronađeni.');
    }
    return res.json({
      ...quizDetails,
      status: quizStatus ? quizStatus : null,
      quizzAnswers: quizzAnswers ? quizzAnswers : null,
      isResolved: !!isQuizzResolved && !!isQuizzResolved.length,
    });
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
    if (!userId || !quizId || !score || !duration) {
      throw new BadRequestError('Nepotpuni podaci potrebni za slanje kviza.');
    }
    const result = await this.quizService.submitQuizResult(
      userId,
      quizId,
      score,
      duration
    );
    return result;
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
    @Body() createQuizBody: CreateQuizBody
  ): Promise<any> {
    if (!createQuizBody.availableUntil || !createQuizBody.questions) {
      throw new BadRequestError(
        'Nedostaju podaci za potrebni za kreiranje novog kviza.'
      );
    }
    return await this.quizService.createQuizWithQuestions(createQuizBody);
  }

  @Authorized()
  @Post('/:quizId/start')
  async startQuiz(
    @Param('quizId') quizId: string,
    @CurrentUser({ required: true }) user: UserType
  ) {
    const userId = user._id;
    await this.quizService.startQuiz(userId, quizId);

    return { message: 'Kviz je uspješno započet.' };
  }

  @Authorized()
  @Put('/:quizId')
  async editQuiz(
    @Param('quizId') quizId: string,
    @Body() updatedQuizData: CreateQuizBody
  ) {
    const editedQuiz = await this.quizService.editQuiz(quizId, updatedQuizData);
    return editedQuiz;
  }

  @Authorized()
  @Delete('/:quizId')
  async deleteQuiz(@Param('quizId') quizId: string) {
    await this.quizService.deleteQuiz(quizId);
    return { message: 'Quiz deleted successfully' };
  }
}
