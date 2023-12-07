import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IUserCard extends Document {
  cardTemplateId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  printedCardId: Schema.Types.ObjectId;
  addedAt: Date;
}

const UserCardSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  printedCardId: {
    type: Schema.Types.ObjectId,
    ref: 'PrintedCard',
    required: true,
  },
  cardTemplateId: {
    type: Schema.Types.ObjectId,
    ref: 'CardTemplate',
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUserCard>('UserCard', UserCardSchema);
