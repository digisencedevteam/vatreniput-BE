import Voting from '../models/Voting';
import VotingOption from '../models/VotingOption';
import UserVote from '../models/UserVote';
import { BadRequestError } from 'routing-controllers';
import mongoose from 'mongoose';

export class VotingService {
  public async getAllVotings(userId: string): Promise<any> {
    const votings = await Voting.find()
      .sort({ createdAt: -1 })
      .populate('votingOptions')
      .exec();

    const votingsWithVotedLabel = await Promise.all(
      votings.map(async (voting) => {
        const userVote = await UserVote.findOne({
          user: userId,
          voting: voting._id,
        });
        return {
          ...voting.toObject(),
          isVoted: !!userVote,
        };
      })
    );

    return votingsWithVotedLabel;
  }
  public async getRecentUnvotedVotings(userId: string): Promise<any> {
    const allVotings = await Voting.find()
      .sort({ createdAt: -1 })
      .select('_id title thumbnail createdAt')
      .exec();

    const votingsWithVoteStatus = await Promise.all(
      allVotings.map(async (voting) => {
        const userVote = await UserVote.findOne({
          user: userId,
          voting: voting._id,
        });
        return {
          ...voting.toObject(),
          isVoted: !!userVote,
        };
      })
    );

    const unvotedVotings = votingsWithVoteStatus.filter(
      (voting) => !voting.isVoted
    );
    const recentUnvotedVotings = unvotedVotings.slice(0, 2);

    return recentUnvotedVotings;
  }

  public async findVotingById(votingId: string): Promise<any> {
    return await Voting.findById(votingId).exec();
  }
  public async findVotingByIdWithOptions(
    votingId: string,
    userId: string
  ): Promise<any> {
    const voting = await Voting.findById(votingId)
      .populate('votingOptions')
      .exec();

    if (!voting) {
      throw new BadRequestError('Voting not found!');
    }
    const userVote = await UserVote.findOne({
      user: userId,
      voting: voting._id,
    });
    return {
      ...voting.toObject(),
      isVoted: !!userVote,
    };
  }
  public async findVotingOptionById(votingOptionId: string): Promise<any> {
    return await VotingOption.findById(votingOptionId).exec();
  }
  async createVoting(votingData: any): Promise<any> {
    const existingVoting = await Voting.findOne({
      title: votingData.title,
    }).exec();
    if (existingVoting) {
      throw new BadRequestError('A voting with this title already exists.');
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

  async updateVoting(votingId: string, updateVotingData: any): Promise<any> {
    const existingVoting = await Voting.findById(votingId)
      .populate('votingOptions')
      .exec();

    if (!existingVoting) {
      throw new BadRequestError('Voting with the given ID does not exist.');
    }

    // Update the basic properties
    existingVoting.title = updateVotingData.title;
    existingVoting.description = updateVotingData.description;
    existingVoting.availableUntil = updateVotingData.availableUntil;
    existingVoting.thumbnail = updateVotingData.thumbnail;

    // Create a map of existing options for easier comparison
    const existingOptionsMap = existingVoting.votingOptions.reduce(
      (map: any, option: any) => {
        map[option.text] = option;
        return map;
      },
      {}
    );

    // Determine options to remove, add, or update
    const optionsToRemove: any[] = [];
    const optionsToAdd: any[] = [];
    const optionsToUpdate: any[] = [];

    updateVotingData.votingOptions.forEach((option: any) => {
      if (existingOptionsMap.hasOwnProperty(option.text)) {
        // Existing option, check if thumbnail has changed
        if (existingOptionsMap[option.text].thumbnail !== option.thumbnail) {
          // Thumbnail has changed, mark for update
          optionsToUpdate.push(option);
        }
      } else {
        // New option, mark for addition
        optionsToAdd.push(option);
      }
    });

    existingVoting.votingOptions.forEach((option: any) => {
      if (
        !updateVotingData.votingOptions.some(
          (newOption: any) => newOption.text === option.text
        )
      ) {
        // Option has been removed, mark for removal
        optionsToRemove.push(option);
      }
    });

    // Remove options that are not in the new data
    await VotingOption.deleteMany({
      _id: { $in: optionsToRemove.map((option) => option._id) },
    });

    // Add new options
    const newVotingOptions = await VotingOption.insertMany(
      optionsToAdd.map((option) => ({
        text: option.text,
        thumbnail: option.thumbnail,
      }))
    );

    // Update existing options
    await Promise.all(
      optionsToUpdate.map(async (option: any) => {
        const existingOption = existingOptionsMap[option.text];
        existingOption.thumbnail = option.thumbnail;
        await existingOption.save();
      })
    );

    // Update the votingOptions in the Voting document
    existingVoting.votingOptions = existingVoting.votingOptions
      .filter((option: any) => !optionsToRemove.includes(option))
      .concat(newVotingOptions.map((option: any) => option._id));

    // Save the updated Voting
    return await existingVoting.save();
  }

  async submitUserVote(
    userId: string,
    votingId: string,
    votingOptionId: string
  ): Promise<any> {
    // Check for an existing vote
    const existingVote = await UserVote.findOne({
      user: userId,
      voting: votingId,
    });
    if (existingVote) {
      throw new Error('User has already voted in this voting.');
    }

    const userVote = new UserVote({
      user: userId,
      voting: votingId,
      votingOption: votingOptionId,
    });

    return await userVote.save();
  }

  async getVotingResults(votingId: mongoose.Types.ObjectId) {
    const votingResults = await UserVote.aggregate([
      { $match: { voting: votingId } },
      {
        $lookup: {
          from: 'votingoptions', // the name of the VotingOption collection
          localField: 'votingOption',
          foreignField: '_id',
          as: 'optionDetails',
        },
      },
      { $unwind: '$optionDetails' },
      {
        $group: {
          _id: '$votingOption',
          count: { $sum: 1 },
          text: { $first: '$optionDetails.text' },
          thumbnail: { $first: '$optionDetails.thumbnail' }, // Added this line
        },
      },
    ]);

    const totalVotes = votingResults.reduce((acc, curr) => acc + curr.count, 0);

    const votingResultsWithPercentage = votingResults.map((result) => ({
      votingOptionId: result._id,
      votingOptionText: result.text,
      votingOptionThumbnail: result.thumbnail, // Added this line
      count: result.count,
      percentage: ((result.count / totalVotes) * 100).toFixed(2),
    }));

    return {
      totalVotes,
      results: votingResultsWithPercentage,
    };
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
