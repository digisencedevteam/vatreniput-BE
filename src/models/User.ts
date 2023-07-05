import { Document, Schema, model } from 'mongoose';

export interface User extends Document {
  email: string;
  password: string;
  username: string;
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
});

export default model<User>('User', userSchema);
