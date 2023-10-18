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
    updateVotingData: any
  ): Promise<any> {
    const existingVoting = await Voting.findById(votingId)
      .populate('votingOptions')
      .exec();

    if (!existingVoting) {
      throw new BadRequestError(
        'Voting with the given ID does not exist.'
      );
    }

    // Update the basic properties
    existingVoting.title = updateVotingData.title;
    existingVoting.description = updateVotingData.description;
    existingVoting.availableUntil = updateVotingData.availableUntil;
    existingVoting.thumbnail = updateVotingData.thumbnail;

    const existingOptionTexts = existingVoting.votingOptions.map(
      (option: any) => option.text
    );
    const newOptionTexts = updateVotingData.votingOptions.map(
      (option: any) => option.text
    );

    // Find options to remove
    const optionsToRemove = existingVoting.votingOptions.filter(
      (option) => !newOptionTexts.includes(option.text)
    );

    const idsToRemove = optionsToRemove.map(
      (option: any) => option._id
    );

    const optionsToAdd = newOptionTexts.filter(
      (option: any) => !existingOptionTexts.includes(option)
    );

    // Remove options that are not in the new data
    await VotingOption.deleteMany({ _id: { $in: idsToRemove } });

    // Add new options
    const newVotingOptions = await VotingOption.insertMany(
      optionsToAdd.map((text: any) => ({ text }))
    );

    // Update the votingOptions in the Voting document
    existingVoting.votingOptions = existingVoting.votingOptions
      .filter((option: any) => !idsToRemove.includes(option._id))
      .concat(newVotingOptions.map((option: any) => option._id));

    // Save the updated Voting
    return await existingVoting.save();
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
