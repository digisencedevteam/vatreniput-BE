import { Document, Schema, model } from 'mongoose';

export interface CardTemplate extends Document {
  title: string;
  description: string;
  videoLink: string;
  imageURLs: string[];
  event: typeof Schema.Types.ObjectId;
  form?: string;
  formId?: typeof Schema.Types.ObjectId;
}

const cardTemplateSchema = new Schema<CardTemplate>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoLink: { type: String, default: null },
  imageURLs: [{ type: String }],
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  form: { type: String, required: false },
  formId: { type: Schema.Types.ObjectId, required: false },
});

export default model<CardTemplate>(
  'CardTemplate',
  cardTemplateSchema
);
