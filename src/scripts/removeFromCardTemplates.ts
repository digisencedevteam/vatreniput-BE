import mongoose from 'mongoose';
import CardTemplate from '../api/models/CardTemplate';

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

const removeFromCardTemplates = async (): Promise<void> => {
  try {
    await CardTemplate.updateMany({}, { $unset: { length: '', type: '' } });
    console.log('Length and Type fields removed from all CardTemplate records');
  } catch (error) {
    console.error('Error updating CardTemplate records:', error);
  }
};

const run = async () => {
  await connectToDatabase();
  await removeFromCardTemplates();
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
};

run();
