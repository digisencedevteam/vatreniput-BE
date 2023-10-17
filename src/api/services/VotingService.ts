import Voting from '../models/Voting';
import VotingOption from '../models/VotingOption';
import UserVote from '../models/UserVote';
import { BadRequestError } from 'routing-controllers';

export class VotingService {
  public async getAllVotings(): Promise<any> {
    return await Voting.find().populate('votingOptions').exec();
  }
  async createVoting(votingData: any): Promise<any> {
    const existingVoting = await Voting.findOne({
      title: votingData.title,
    }).exec();
    if (existingVoting) {
      throw new BadRequestError(
        'A voting with this title already exists.'
      );
    }

    const votingOptions = await VotingOption.insertMany(
      votingData.votingOptions
    );
    const newVoting = new Voting({
      ...votingData,
      votingOptions: votingOptions.map((option) => option._id),
    });

    return await newVoting.save();
  }

  async updateVoting(
    votingId: string,
    updatedData: any
  ): Promise<any> {
    const voting = await Voting.findById(votingId).exec();
    if (!voting) {
      throw new BadRequestError('Voting not found.');
    }

    // Handle VotingOption updates here (create new options, delete removed ones, etc.)

    Object.assign(voting, updatedData);
    return await voting.save();
  }

  async deleteVoting(votingId: string): Promise<any> {
    const voting = await Voting.findById(votingId).exec();
    if (!voting) {
      throw new BadRequestError('Voting not found.');
    }

    await VotingOption.deleteMany({
      _id: { $in: voting.votingOptions },
    });
    await UserVote.deleteMany({ voting: voting._id });
    await Voting.deleteOne({ _id: voting._id });

    return { message: 'Voting deleted successfully' };
  }
}
