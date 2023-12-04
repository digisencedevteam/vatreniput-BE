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
} from 'routing-controllers';
import { Response } from 'express';

import { VotingService } from '../services/VotingService'; // Replace with your actual path
import { CreateVotingBody, SubmitVote } from './requests/VotingRequests';
import { UserType } from '../../types';
import mongoose from 'mongoose';

@JsonController('/votings')
export class VotingController {
  private votingService: VotingService;
  constructor() {
    this.votingService = new VotingService();
  }
  @Authorized()
  @Get('/')
  public async getAllVotings(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response
  ): Promise<any> {
    try {
      const votings = await this.votingService.getAllVotings(user._id);
      return res.json(votings);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: 'An error occurred while fetching votings.' });
    }
  }

  @Authorized()
  @Get('/user/:userId/top-votes')
  public async getUserTopVotedOptions(
    @Param('userId') userId: string,
    @Res() res: Response
  ): Promise<any> {
    try {
      const results = await this.votingService.getUserVotedVotingsWithTopOption(
        userId
      );
      return res.json(results);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: 'An error occurred while fetching the data.' });
    }
  }

  @Authorized()
  @Get('/:votingId')
  public async getVotingDetails(
    @CurrentUser({ required: true }) user: UserType,
    @Res() res: Response,
    @Param('votingId') votingId: string
  ): Promise<any> {
    try {
      const voting = await this.votingService.findVotingByIdWithOptions(
        votingId,
        user._id
      );
      if (!voting) {
        throw new BadRequestError('Voting not found!');
      }
      return res.json(voting);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: 'An error occurred while fetching votings.' });
    }
  }

  @Authorized()
  @Get('/:votingId/results')
  async getResults(@Res() res: Response, @Param('votingId') votingId: string) {
    const results = await this.votingService.getVotingResults(
      new mongoose.Types.ObjectId(votingId)
    );
    return res.json(results);
    // Add your logic here to also fetch and include details about the voting itself
  }

  @Authorized()
  @Post('/')
  public async createVoting(
    @Body() votingData: CreateVotingBody,
    @Res() res: Response
  ) {
    try {
      const newVoting = await this.votingService.createVoting(votingData);
      return res.status(200).json(newVoting);
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  @Authorized()
  @Post('/vote')
  public async vote(
    @CurrentUser({ required: true }) user: UserType,
    @Body() body: SubmitVote,
    @Res() res: Response
  ) {
    try {
      const { votingId, votingOptionId } = body;
      const voting = await this.votingService.findVotingById(votingId);
      if (!voting) {
        throw new BadRequestError('Wrong voting ID provided!');
      }
      const votingOpttion = await this.votingService.findVotingOptionById(
        votingOptionId
      );
      if (!votingOpttion) {
        throw new BadRequestError('Wrong voting option ID provided!');
      }
      await this.votingService.submitUserVote(
        user._id,
        votingId,
        votingOptionId
      );
      return res.status(200).json({ message: 'Voting submitted successfully' });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }
  @Authorized()
  @Put('/:id')
  public async updateVoting(
    @Param('id') id: string,
    @Body() updateData: any,
    @Res() res: Response
  ) {
    try {
      const updatedVoting = await this.votingService.updateVoting(
        id,
        updateData
      );
      return res.status(200).json(updatedVoting);
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  @Authorized()
  @Delete('/:id')
  public async deleteVoting(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.votingService.deleteVoting(id);
      return res.status(200).json(result);
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }
}
