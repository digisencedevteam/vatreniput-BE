import mongoose, { Schema, Document } from 'mongoose';

export interface Voting extends Document {
  title: string;
  description: string;
  votingOptions: Array<Schema.Types.ObjectId>;
  createdAt: Date;
  expiresAt: Date;
  availableUntil: Date;
  thumbnail: string;
}

const votingSchema: Schema = new Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  votingOptions: [
    { type: Schema.Types.ObjectId, ref: 'VotingOption' },
  ],
  createdAt: { type: Date, default: Date.now },
  availableUntil: { type: Date, default: null },
  expiresAt: { type: Date },
  thumbnail: { type: String },
});

export default mongoose.model<Voting>('Voting', votingSchema);
