import mongoose, { Schema, Document } from 'mongoose';

export interface QuizStatus extends Document {
  userId: Schema.Types.ObjectId;
  quizId: Schema.Types.ObjectId;
  status: 'notStarted' | 'inProgress' | 'resolved';
  startTime?: Date;
  endTime?: Date;
}

const quizStatusSchema: Schema = new Schema({
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
  status: {
    type: String,
    enum: ['notStarted', 'inProgress', 'resolved'],
    required: true,
  },
  startTime: { type: Date },
});

export default mongoose.model<QuizStatus>(
  'QuizStatus',
  quizStatusSchema
);
