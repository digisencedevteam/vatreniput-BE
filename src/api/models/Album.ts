import { Document, Schema, model } from 'mongoose';

export interface Album extends Document {
  code: string;
  isUsed: boolean;
  owner: typeof Schema.Types.ObjectId;
  cards: (typeof Schema.Types.ObjectId)[];
}

const albumSchema = new Schema<Album>({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  isUsed: {
    type: Boolean,
    required: true,
    default: false,
  },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
});

export default model<Album>('Album', albumSchema);
