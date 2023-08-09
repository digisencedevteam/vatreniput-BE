import { Document, Schema, model } from 'mongoose';

export interface Event extends Document {
  name: string;
  location: string;
  year: number;
  description: string;
}

const eventSchema = new Schema<Event>({
  name: { type: String, required: true },
  location: { type: String, required: true },
  year: { type: Number, required: true },
  description: { type: String },
});

export default model<Event>('Event', eventSchema);
