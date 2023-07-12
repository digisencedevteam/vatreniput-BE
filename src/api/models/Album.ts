import { Document, Schema, model } from 'mongoose';

export interface Album extends Document {
  code: string;
  isUsed: boolean;
}

const albumSchema = new Schema<Album>({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  isUsed: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export default model<Album>('Album', albumSchema);
