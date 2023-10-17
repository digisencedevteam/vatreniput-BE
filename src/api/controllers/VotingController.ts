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
} from 'routing-controllers';
import { Response } from 'express';

import { VotingService } from '../services/VotingService'; // Replace with your actual path
import { CreateVotingBody } from './requests/VotingRequests';

@JsonController('/votings')
export class VotingController {
  private votingService: VotingService;
  constructor() {
    this.votingService = new VotingService();
  }
  @Authorized()
  @Get('/')
  public async getAllVotings(@Res() res: Response): Promise<any> {
    try {
      const votings = await this.votingService.getAllVotings();
      return res.json(votings);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: 'An error occurred while fetching votings.' });
    }
  }

  @Authorized()
  @Post('/')
  public async createVoting(
    @Body() votingData: CreateVotingBody,
    @Res() res: Response
  ) {
    try {
      const newVoting = await this.votingService.createVoting(
        votingData
      );
      return res.status(200).json(newVoting);
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
  public async deleteVoting(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.votingService.deleteVoting(id);
      return res.status(200).json(result);
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }
}
