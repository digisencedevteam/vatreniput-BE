import mongoose, { Schema, Document } from 'mongoose';

export interface VotingOption extends Document {
  text: string;
  thumbnail: string;
}

const votingOptionSchema: Schema = new Schema({
  text: { type: String, required: true },
  thumbnail: { type: String },
});

export default mongoose.model<VotingOption>(
  'VotingOption',
  votingOptionSchema
);
