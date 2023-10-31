import mongoose, { Schema, Document } from 'mongoose';

export interface UserQuizzAnswer extends Document {
  userId: Schema.Types.ObjectId;
  quizId: Schema.Types.ObjectId;
  questionId: Schema.Types.ObjectId;
  selectedOption: number;
  isCorrect: boolean;
}

const userQuizzAnswerSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selectedOption: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
});

export default mongoose.model<UserQuizzAnswer>(
  'UserQuizzAnswer',
  userQuizzAnswerSchema
);
