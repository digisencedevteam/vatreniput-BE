import mongoose, { Schema, Document } from 'mongoose';

export interface PasswordResetToken extends Document {
  userId: Schema.Types.ObjectId;
  token: string;
  expires: Date;
}

const passwordResetTokenSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
});

export default mongoose.model<PasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema
);
