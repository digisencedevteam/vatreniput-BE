import Voting from '../models/Voting';
import VotingOption from '../models/VotingOption';
import UserVote from '../models/UserVote';
import { BadRequestError } from 'routing-controllers';
import mongoose, { Types } from 'mongoose';

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
          ...voting.toObject(), // Convert the Mongoose Document to a plain JavaScript object
          isVoted: !!userVote, // The !! operator converts userVote to a boolean (true if exists, false if not)
        };
      })
    );

    return votingsWithVotedLabel;
  }

  public async getRecentUnvotedVotings(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('InvalidUserID');
    }
    try {
      const allVotings = await Voting.find()
        .sort({ createdAt: -1 })
        .select('_id title thumbnail createdAt')
        .exec();
      const unvotedVotings = allVotings.filter(async (voting) => {
        const userVote = await UserVote.findOne({
          user: userId,
          voting: voting._id,
        });
        return !userVote;
      });
      const recentUnvotedVotings = unvotedVotings.slice(0, 2);
      if (!recentUnvotedVotings || recentUnvotedVotings.length === 0) {
        return [];
      }
      return recentUnvotedVotings;
    } catch (error: any) {
      console.error(
        `Error fetching recent unvoted votings for user: ${userId}`,
        error
      );
      throw new Error('DatabaseQueryFailed');
    }
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
    existingVoting.title = updateVotingData.title;
    existingVoting.description = updateVotingData.description;
    existingVoting.availableUntil = updateVotingData.availableUntil;
    existingVoting.thumbnail = updateVotingData.thumbnail;

    const existingOptionsMap = existingVoting.votingOptions.reduce(
      (map: any, option: any) => {
        map[option.text] = option;
        return map;
      },
      {}
    );

    const optionsToRemove: any[] = [];
    const optionsToAdd: any[] = [];
    const optionsToUpdate: any[] = [];

    updateVotingData.votingOptions.forEach((option: any) => {
      if (existingOptionsMap.hasOwnProperty(option.text)) {
        if (existingOptionsMap[option.text].thumbnail !== option.thumbnail) {
          optionsToUpdate.push(option);
        }
      } else {
        optionsToAdd.push(option);
      }
    });

    existingVoting.votingOptions.forEach((option: any) => {
      if (
        !updateVotingData.votingOptions.some(
          (newOption: any) => newOption.text === option.text
        )
      ) {
        optionsToRemove.push(option);
      }
    });

    await VotingOption.deleteMany({
      _id: { $in: optionsToRemove.map((option) => option._id) },
    });

    const newVotingOptions = await VotingOption.insertMany(
      optionsToAdd.map((option) => ({
        text: option.text,
        thumbnail: option.thumbnail,
      }))
    );

    await Promise.all(
      optionsToUpdate.map(async (option: any) => {
        const existingOption = existingOptionsMap[option.text];
        existingOption.thumbnail = option.thumbnail;
        await existingOption.save();
      })
    );

    existingVoting.votingOptions = existingVoting.votingOptions
      .filter((option: any) => !optionsToRemove.includes(option))
      .concat(newVotingOptions.map((option: any) => option._id));

    return await existingVoting.save();
  }

  async submitUserVote(
    userId: string,
    votingId: string,
    votingOptionId: string
  ): Promise<any> {
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
          from: 'votingoptions',
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
          thumbnail: { $first: '$optionDetails.thumbnail' },
        },
      },
    ]);
    const totalVotes = votingResults.reduce((acc, curr) => acc + curr.count, 0);
    const votingResultsWithPercentage = votingResults.map((result) => ({
      votingOptionId: result._id,
      votingOptionText: result.text,
      votingOptionThumbnail: result.thumbnail,
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
