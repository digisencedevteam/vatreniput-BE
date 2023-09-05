import mongoose from 'mongoose';
import dotenv from 'dotenv';
// @ts-ignore
import User from '../api/models/User.ts';
// @ts-ignore
import Album from '../api/models/Album.ts';
// @ts-ignore
import Event from '../api/models/Event.ts';
// @ts-ignore
import CardTemplate from '../api/models/CardTemplate.ts';
// @ts-ignore
import PrintedCard from '../api/models/PrintedCard.ts';
// @ts-ignore
import UserCard from '../api/models/UserCard.ts';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/vatreniput';

mongoose.connect(MONGODB_URI);

const seedUsers = async () => {
  // Example data for a user
  const userData = [
    {
      email: 'antonio@test.com',
      password: 'password',
      username: 'testerantonio',
      // ... other fields
    },
    // ... other users
  ];

  await User.insertMany(userData);
  console.log('Users seeded successfully!');
};

const seedAlbums = async () => {
  const user = await User.findOne({ username: 'testerantonio' });

  // Example data for an album
  const albumData = [
    {
      code: '1234',
      isUsed: true,
      owner: user._id,
    },
    // ... other albums
  ];

  await Album.insertMany(albumData);
  console.log('Albums seeded successfully!');
};

const seedEvents = async () => {
  // Example data for events
  const eventData = [
    {
      name: 'Svjetsko prvenstvo - Rusija 2018',
      location: 'Rusija',
      year: 2018,
    },
    {
      name: 'Svjetsko prvenstvo - Qatar 2022',
      location: 'Qatar',
      year: 2022,
    },
    // ... other events
  ];

  await Event.insertMany(eventData);
  console.log('Events seeded successfully!');
};
// dodavanje jedinstvenih sličica - sve one koje ćemo imatu u albumu
const seedCardTemplates = async () => {
  const eventRusija = await Event.findOne({ location: 'Rusija' });
  const eventKatar = await Event.findOne({ location: 'Qatar' });

  // Example data for card templates
  const cardTemplatesData = [
    {
      event: eventRusija._id,
      title: 'Dejan Lovren',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1690543607/srna_pozdrav_navija%C4%8Di_tcpljm.jpg',
      ],
      // ... other fields
    },
    {
      event: eventKatar._id,
      title: 'Marko Livaja',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1690543607/srna_pozdrav_navija%C4%8Di_tcpljm.jpg',
      ],
      // ... other fields
    },
    // ... other card templates
  ];

  await CardTemplate.insertMany(cardTemplatesData);
  console.log('Card templates seeded successfully!');
};

const seedPrintedCards = async () => {
  const sličicaLovren = await CardTemplate.findOne({
    title: 'Dejan Lovren',
  });
  const sličicaLivaja = await CardTemplate.findOne({
    title: 'Marko Livaja',
  });
  const user = await User.findOne({ username: 'testerantonio' });

  // Example data for printed cards
  const printedCardsData = [
    {
      cardId: sličicaLovren._id,
      qrCode: 'qrCode1',
      isScanned: false,
    },
    {
      cardId: sličicaLovren._id,
      qrCode: 'qrCode2',
      isScanned: true,
      owner: user._id,
    },
    {
      cardId: sličicaLivaja._id,
      qrCode: 'qrCode3',
      isScanned: true,
      owner: user._id,
    },
    {
      cardId: sličicaLivaja._id,
      qrCode: 'qrCode4',
      isScanned: false,
    },
    // ... other printed cards
  ];

  await PrintedCard.insertMany(printedCardsData);
  console.log('Printed cards seeded successfully!');
};

const seedUserCards = async () => {
  const user = await User.findOne({ username: 'testUser' });
  const printedCardqrCode2 = await PrintedCard.findOne({
    qrCode: 'qrCode2',
  });
  const printedCardqrCode3 = await PrintedCard.findOne({
    qrCode: 'qrCode3',
  });

  // Create user cards data
  const userCardData = [
    {
      user: user._id,
      printedCard: printedCardqrCode2._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      user: user._id,
      printedCard: printedCardqrCode3._id, // Reference to a printed card
      addedAt: new Date(),
    },
    // ... other user cards
  ];

  await UserCard.insertMany(userCardData);
  console.log('User cards seeded successfully!');
};

const seedAll = async () => {
  await seedUsers();
  await seedAlbums();
  await seedEvents();
  await seedCardTemplates();
  await seedPrintedCards();
  await seedUserCards();

  mongoose.connection.close();
};

seedAll();
