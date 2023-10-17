import mongoose, { Schema, Document } from 'mongoose';

export interface UserVote extends Document {
  user: Schema.Types.ObjectId;
  voting: Schema.Types.ObjectId;
  votingOption: Schema.Types.ObjectId;
}

const userVoteSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  voting: {
    type: Schema.Types.ObjectId,
    ref: 'Voting',
    required: true,
  },
  votingOption: {
    type: Schema.Types.ObjectId,
    ref: 'VotingOption',
    required: true,
  },
});

export default mongoose.model<UserVote>('UserVote', userVoteSchema);
