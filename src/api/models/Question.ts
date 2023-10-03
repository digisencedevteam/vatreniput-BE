import mongoose, { Schema, Document } from 'mongoose';

export interface Question extends Document {
  text: string;
  options: string[];
  correctOption: number;
  image?: string;
}

const questionSchema: Schema = new Schema({
  text: { type: String, required: true },
  image: { type: String },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true },
});

export default mongoose.model<Question>('Question', questionSchema);
