import { Document, Schema, model } from 'mongoose';

export interface Album extends Document {
  owner: typeof Schema.Types.ObjectId;
  cards: (typeof Schema.Types.ObjectId)[]; // References to UserCards
}

const albumSchema = new Schema<Album>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // owner is required if the album is in use
  cards: [{ type: Schema.Types.ObjectId, ref: 'UserCard' }], // Reference to UserCard
});

export default model<Album>('Album', albumSchema);
