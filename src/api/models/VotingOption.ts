import mongoose, { Schema, Document } from 'mongoose';

export interface VotingOption extends Document {
  text: string;
}

const votingOptionSchema: Schema = new Schema({
  text: { type: String, required: true },
});

export default mongoose.model<VotingOption>(
  'VotingOption',
  votingOptionSchema
);
