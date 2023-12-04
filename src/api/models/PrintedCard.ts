import { Document, Schema, model } from 'mongoose';

export interface PrintedCard extends Document {
  isScanned: boolean;
  cardTemplate: typeof Schema.Types.ObjectId;
  owner: typeof Schema.Types.ObjectId;
}

const printedCardSchema = new Schema<PrintedCard>({
  isScanned: { type: Boolean, default: false },
  cardTemplate: { type: Schema.Types.ObjectId, ref: 'CardTemplate' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
});

export default model<PrintedCard>('PrintedCard', printedCardSchema);
