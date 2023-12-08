import { Document, Schema, model } from 'mongoose';

export interface CardTemplate extends Document {
  ordinalNumber: number;
  title?: string;
  // description: string;
  videoLink: string;
  imageURLs: string[];
  form: string;
  length: string;
  type: string;
  author?: string;
  event: typeof Schema.Types.ObjectId;
}

const cardTemplateSchema = new Schema<CardTemplate>({
  ordinalNumber: { type: Number, required: true },
  title: { type: String, default: null },
  // description: { type: String, required: true },
  videoLink: { type: String, default: null },
  imageURLs: [{ type: String, default: [] }],
  form: { type: String, required: false },
  length: { type: String, required: false },
  author: { type: String, default: null },
  type: { type: String, required: false },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
});

export default model<CardTemplate>('CardTemplate', cardTemplateSchema);
