import { Document, Schema, model } from 'mongoose';

export interface User extends Document {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  isEmailVerified: boolean;
  verificationToken: string;
  role: 'admin' | 'regular';
  album: typeof Schema.Types.ObjectId;
}

const userSchema = new Schema<User>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: false,
    unique: false,
  },
  lastName: {
    type: String,
    required: false,
    unique: false,
  },
  role: {
    type: String,
    required: false,
  },
  photoURL: {
    type: String,
    required: false,
    unique: false,
  },
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  verificationToken: {
    type: String,
    required: false,
  },
  album: { type: Schema.Types.ObjectId, ref: 'Album' },
});

export default model<User>('User', userSchema);
