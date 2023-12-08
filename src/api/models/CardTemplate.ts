import { Document, Schema, model } from 'mongoose';

export interface CardTemplate extends Document {
  ordinalNumber: number;
  title?: string;
  videoLink: string;
  imageURLs: string[];
  form: string;
  formId: typeof Schema.Types.ObjectId;
  author: string;
  event: typeof Schema.Types.ObjectId;
}

const cardTemplateSchema = new Schema<CardTemplate>({
  ordinalNumber: { type: Number, required: true },
  title: { type: String, default: null },
  videoLink: { type: String, default: null },
  imageURLs: [{ type: String, default: [] }],
  form: { type: String, required: false },
  formId: { type: Schema.Types.ObjectId, required: false },
  author: { type: String, required: false, default: null },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
});

export default model<CardTemplate>('CardTemplate', cardTemplateSchema);
