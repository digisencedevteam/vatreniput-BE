import mongoose, { Schema, Document } from 'mongoose';

export interface Quiz extends Document {
  title: string;
  description: string;
  thumbnail: string;
  questions: Array<Schema.Types.ObjectId>;
  isExpired: boolean;
  createdAt: Date;
}

const quizSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  thumbnail: { type: String },
  createdAt: { type: Date, default: Date.now },
  isExpired: { type: Boolean, default: false },
});

export default mongoose.model<Quiz>('Quiz', quizSchema);
