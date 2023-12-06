import { Document, Schema, model } from 'mongoose';

export interface PrintedCard extends Document {
  qrCode?: string;
  isScanned: boolean;
  cardTemplate: typeof Schema.Types.ObjectId;
  owner: typeof Schema.Types.ObjectId; // Reference to User (if card is scanned/owned)
}

const printedCardSchema = new Schema<PrintedCard>({
  qrCode: { type: String, required: false, unique: true },
  isScanned: { type: Boolean, default: false },
  cardTemplate: { type: Schema.Types.ObjectId, ref: 'CardTemplate' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
});

export default model<PrintedCard>('PrintedCard', printedCardSchema);
