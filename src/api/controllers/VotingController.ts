import {
  JsonController,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
  BadRequestError,
  Authorized,
  Get,
  CurrentUser,
  NotFoundError,
  QueryParam,
} from 'routing-controllers';
import { Response } from 'express';
import { VotingService } from '../services/VotingService';
import { CreateVotingBody, SubmitVote } from './requests/VotingRequests';
import { UserType } from '../../types';
import mongoose from 'mongoose';
import { isValidDate } from '../helpers/helper';
import { UserService } from '../services/UserService';

@JsonController('/votings')
export class VotingController {
  private votingService: VotingService;
  private userService: UserService;

  constructor() {
    this.votingService = new VotingService();
    this.userService = new UserService();
  }

  @Authorized()
  @Get('/')
  public async getAllVotings(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response
  ): Promise<any> {
    const votings = await this.votingService.getAllVotings(user._id);
    if (!votings) {
      throw new NotFoundError('Glasanja nisu pronađena za korisnika.');
    }
    return res.json(votings);
  }

  @Authorized()
  @Get('/voted')
  public async getVotedVotings(
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10,

    @Res() res: Response
  ): Promise<any> {
    const userId = user._id;
    const result = await this.votingService.getVotedVotings(
      userId,
      page,
      limit
    );
    return res.json(result);
  }

  @Authorized()
  @Get('/unvoted')
  public async getUnvotedVotings(
    @CurrentUser({ required: true }) user: UserType,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10,
    @Res() res: Response
  ): Promise<any> {
    const userId = user._id;
    const result = await this.votingService.getUnvotedVotings(
      userId,
      page,
      limit
    );
    return res.json(result);
  }

  @Authorized()
  @Get('/user/:userId/top-votes')
  public async getUserTopVotedOptions(
    @Param('userId') userId: string,
    @Res() res: Response
  ): Promise<any> {
    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new NotFoundError('Korisnik nije pronađen.');
    }
    const results = await this.votingService.getUserVotedVotingsWithTopOption(
      userId
    );
    if (!results) {
      throw new NotFoundError(
        'Nisu pronađeni najpopulariniji odabiri iz glasanja koje je korisnik riješio.'
      );
    }
    return res.json(results);
  }

  @Authorized()
  @Get('/:votingId')
  public async getVotingDetails(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response,
    @Param('votingId') votingId: string
  ): Promise<any> {
    const voting = await this.votingService.findVotingByIdWithOptions(
      votingId,
      user._id
    );
    return res.json(voting);
  }

  @Authorized()
  @Get('/:votingId/results')
  async getResults(@Res() res: Response, @Param('votingId') votingId: string) {
    const voting = await this.votingService.findVotingById(votingId);
    if (!voting) {
      throw new NotFoundError('Glasanje nije pronađeno.');
    }
    const results = await this.votingService.getVotingResults(
      new mongoose.Types.ObjectId(votingId)
    );
    return res.json(results);
  }

  @Authorized()
  @Post('/')
  public async createVoting(
    @Body() votingData: CreateVotingBody,
    @Res() res: Response
  ) {
    if (!votingData.title || !votingData.votingOptions) {
      throw new BadRequestError(
        'Nedostaju podaci za kreiranje novog glasanja.'
      );
    }
    const newVoting = await this.votingService.createVoting(votingData);
    return res.status(200).json(newVoting);
  }

  @Authorized()
  @Post('/vote')
  public async vote(
    @CurrentUser({ required: true }) user: UserType,
    @Body() body: SubmitVote,
    @Res() res: Response
  ) {
    const { votingId, votingOptionId } = body;
    if (!votingId) {
      throw new BadRequestError('Nedostaje ID glasanja.');
    }
    if (!votingOptionId) {
      throw new BadRequestError('Nedostaje odabir opcije za glasanje.');
    }
    const voting = await this.votingService.findVotingById(votingId);
    if (!voting) {
      throw new NotFoundError('Glasanje nije pronađeno.');
    }
    const votingOption = await this.votingService.findVotingOptionById(
      votingOptionId
    );
    if (!votingOption) {
      throw new NotFoundError('Nije pronađea opcija za glasanje.');
    }
    await this.votingService.submitUserVote(user._id, votingId, votingOptionId);
    return res.status(200).json({ message: 'Glasanje uspješno objavljeno.' });
  }

  @Authorized()
  @Put('/:id')
  public async updateVoting(
    @Param('id') id: string,
    @Body() updateData: any,
    @Res() res: Response
  ) {
    if (
      !updateData.title ||
      !updateData.description ||
      !updateData.availableUntil ||
      !updateData.thumbnail
    ) {
      throw new BadRequestError(
        'Nedostaju podaci za ažuriranje glasanja. Molim dodajte sve potrebne podatke.'
      );
    }
    if (!isValidDate(updateData.availableUntil)) {
      throw new BadRequestError(
        'Datum završetka dostupnosti nije u pravom formatu. Molim odaberite valjani datum.'
      );
    }
    const updatedVoting = await this.votingService.updateVoting(id, updateData);
    return res.json(updatedVoting);
  }

  @Authorized()
  @Delete('/:id')
  public async deleteVoting(@Param('id') id: string, @Res() res: Response) {
    const voting = await this.votingService.findVotingById(id);
    if (!voting) {
      throw new NotFoundError('Glasanje nije pronađeno');
    }
    const result = await this.votingService.deleteVoting(voting);
    return res.json(result);
  }
}
