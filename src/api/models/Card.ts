import { Document, Schema, model } from 'mongoose';

export interface Card extends Document {
  code: string;
  title: string;
  description: string;
  videoLink: string;
  imageURLs: string[];
  isScanned: boolean;
  event: typeof Schema.Types.ObjectId;
}

const cardSchema = new Schema<Card>({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoLink: { type: String, required: false },
  imageURLs: [{ type: String }],
  isScanned: { type: Boolean, default: false },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
});

export default model<Card>('Card', cardSchema);
