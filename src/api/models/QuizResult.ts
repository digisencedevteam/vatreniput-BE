import mongoose, { Schema, Document } from 'mongoose';

export interface QuizResult extends Document {
  userId: Schema.Types.ObjectId; // Reference to the user who took the quiz
  quizId: Schema.Types.ObjectId; // Reference to the quiz that was taken
  score: number; // The user's score on the quiz
  dateTaken: Date; // The date and time when the quiz was taken
  duration: number; // Time taken to complete the quiz (in seconds)
}

const quizResultSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to your User model
    required: true,
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz', // Reference to your Quiz model
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  dateTaken: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number,
    required: true,
  },
});

export default mongoose.model<QuizResult>(
  'QuizResult',
  quizResultSchema
);
