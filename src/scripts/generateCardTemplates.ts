import mongoose from 'mongoose';
import * as xlsx from 'xlsx';
import CardTemplate from '../api/models/CardTemplate';
import Event from '../api/models/Event'; // Ensure this path is correct
import * as path from 'path';

const MONGODB_URI = 'mongodb://localhost:27017/vatreniput';

const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

const importExcelData = async (): Promise<void> => {
  await connectToDatabase();
  const filePath = path.resolve(__dirname, 'stickerDataNew.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[] = xlsx.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
  });

  for (let i = 1; i < rows.length; i++) {
    const [ordinalNumber, form, , type, title, length, author, eventName] =
      rows[i] as any[];
    console.log(`Reading row ${i}:`, rows[i]);
    try {
      const event = await Event.findOne({ name: eventName });
      if (!event) {
        throw new Error(`Event not found: ${eventName}`);
      }
      const cardData = {
        ordinalNumber: Number(ordinalNumber),
        form,
        type,
        title,
        length,
        author,
        event: event._id,
      };
      const cardTemplate = new CardTemplate(cardData);
      await cardTemplate.save();
      console.log(`CardTemplate created: ${title} with Event: ${eventName}`);
    } catch (error) {
      console.error('Error processing row:', error);
    }
  }
  console.log('CardTemplate tablica kreirana i popunjena!');
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
};

importExcelData();
