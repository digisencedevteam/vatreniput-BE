import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCard extends Document {
  userId: Schema.Types.ObjectId; // Reference to the user
  printedCardId: Schema.Types.ObjectId; // Reference to the PrintedCard instance
  addedAt: Date; // Date when the card was added to the user's collection
}

const UserCardSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Assuming your user model is named 'User'
    required: true,
  },
  printedCardId: {
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
