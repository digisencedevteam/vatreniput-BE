import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCard extends Document {
  user: Schema.Types.ObjectId; // Reference to the user
  printedCard: Schema.Types.ObjectId; // Reference to the PrintedCard instance
  addedAt: Date; // Date when the card was added to the user's collection
}

const UserCardSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Assuming your user model is named 'User'
    required: true,
  },
  printedCard: {
    type: Schema.Types.ObjectId,
    ref: 'PrintedCard',
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUserCard>('UserCard', UserCardSchema);
