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
import bcrypt from 'bcrypt';

import mongoose, { Types } from 'mongoose';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/vatreniput';

mongoose.connect(MONGODB_URI);

const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash('password', 10);
  // Example data for a user
  const userData = [
    {
      email: 'antonio@test.com',
      password: hashedPassword,
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
      owner: user!._id,
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
    {
      name: 'Svjetsko prvenstvo - Francuska 1998',
      location: 'Francuska',
      year: 1999,
    },
    {
      name: 'UEFA Euro - Poljska i Ukrajina 2012',
      location: 'Poljska i Ukrajina',
      year: 2012,
    },
    {
      name: 'Svjetsko Prvenstvo - Brazil 2014',
      location: 'Brazil',
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
  if (!eventRusija) {
    console.error('Event "Rusija" not found in the database.');
    return;
  }
  const eventKatar = await Event.findOne({ location: 'Qatar' });
  const eventFrancuska = await Event.findOne({
    location: 'Francuska',
  });
  const eventPoljskaUkrajina = await Event.findOne({
    location: 'Poljska i Ukrajina',
  });
  const eventBrazil = await Event.findOne({ location: 'Brazil' });

  // Example data for card templates
  const cardTemplatesData = [
    {
      event: eventRusija!._id,
      title: 'Dejan Lovren',
      description: 'Ovo je Dejan Lovren',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1690543607/srna_pozdrav_navija%C4%8Di_tcpljm.jpg',
      ],
      // ... other fields
    },
    {
      event: eventRusija!._id,
      title: 'Milan Badelj',
      description: 'Ovo je Milan Badelj',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926810/badelj_danska_zeyvjn.jpg',
      ],
      // ... other fields
    },
    {
      event: eventRusija!._id,
      title: 'Mario Mandžukić',
      description: 'Ovo je Mario Mandžukić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926819/mandz%CC%8Cukic%CC%81_peris%CC%8Cic%CC%81_slavlje_1_mcsnzt.jpg',
      ],
      // ... other fields
    },
    {
      event: eventRusija!._id,
      title: 'Luka Modrić',
      description: 'Ovo je Luka Modrić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926829/Messi_Modric%CC%81_2_ubx2uz.jpg',
      ],
      // ... other fields
    },
    {
      event: eventRusija!._id,
      title: 'Ivan Rakitić',
      description: 'Ovo je Ivan Rakitić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926833/rakitic%CC%81_messi_0_vy8u5u.jpg',
      ],
      // ... other fields
    },
    {
      event: eventRusija!._id,
      title: 'Danijel Subašić',
      description: 'Ovo je Danijel Subašić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926850/subas%CC%8Cic%CC%81_obrana_1_z9olsm.jpg',
      ],
      // ... other fields
    },
    {
      event: eventRusija!._id,
      title: 'Ivan Strinić',
      description: 'Ovo je Ivan Strinić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926841/strinic%CC%81_mbappe_ctgm7g.jpg',
      ],
      // ... other fields
    },
    {
      event: eventKatar!._id,
      title: 'Marko Livaja',
      description: 'Ovo je Marko Livaja',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1690543607/srna_pozdrav_navija%C4%8Di_tcpljm.jpg',
      ],
      // ... other fields
    },
    {
      event: eventKatar!._id,
      title: 'Borna Sosa',
      description: 'Ovo je Borna Sosa',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926246/sosa_1_3_tfsxnb.jpg',
      ],
      // ... other fields
    },
    {
      event: eventKatar!._id,
      title: 'Borna Barišić',
      description: 'Ovo je Borna Barišić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926381/borna_baris%CC%8Cic%CC%81_aslfff.jpg',
      ],
      // ... other fields
    },
    {
      event: eventKatar!._id,
      title: 'Nikola Vlašić',
      description: 'Ovo je Nikola Vlašić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693926650/vlas%CC%8Cic%CC%81_kopija_2_p8nanz.jpg',
      ],
      // ... other fields
    },
    {
      event: eventFrancuska!._id,
      title: 'Davor Šuker',
      description: 'Ovo je Davor Šuker',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693923578/SLAVLJE4_copy_frghmj.jpg',
      ],
      // ... other fields
    },
    {
      event: eventFrancuska!._id,
      title: 'Dražen Ladić',
      description: 'Ovo je Dražen Ladić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693923677/HRV52006_copy_p8edoc.jpg',
      ],
      // ... other fields
    },
    {
      event: eventFrancuska!._id,
      title: 'Robert Prosinečki',
      description: 'Ovo je Robert Prosinečki',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693923831/HRV21107_copy_bdengh.jpg',
      ],
      // ... other fields
    },
    {
      event: eventFrancuska!._id,
      title: 'Mario Stanić',
      description: 'Ovo je Mario Stanić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1690543607/srna_pozdrav_navija%C4%8Di_tcpljm.jpg',
      ],
      // ... other fields
    },
    {
      event: eventFrancuska!._id,
      title: 'Goran Vlaović',
      description: 'Ovo je Goran Vlaović',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693924116/vlaovic2_copy_l1j3rf.jpg',
      ],
      // ... other fields
    },
    {
      event: eventFrancuska!._id,
      title: 'Ćiro Blažević',
      description: 'Ovo je Ćiro Blažević',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693925825/HRV31207_copy_jy960u.jpg',
      ],
      // ... other fields
    },
    {
      event: eventPoljskaUkrajina!._id,
      title: 'Vedran Ćorluka',
      description: 'Ovo je Vedran Ćorluka',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1691679886/corluka_doyle_uahqyv.jpg',
      ],
      // ... other fields
    },
    {
      event: eventPoljskaUkrajina!._id,
      title: 'Eduardo da Silva',
      description: 'Ovo je Edurardo da Silva',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693826663/eduardo-140612_xd6931.jpg',
      ],
      // ... other fields
    },
    {
      event: eventPoljskaUkrajina!._id,
      title: 'Danijel Pranjić',
      description: 'Ovo je Danijel Pranjić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693583893/pranjic-180612_nzd1rw.jpg',
      ],
      // ... other fields
    },
    {
      event: eventPoljskaUkrajina!._id,
      title: 'Ognjen Vukojević',
      description: 'Ovo je Ognjen Vukojević',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693927515/xavi_vukojevic_mhuovp.jpg',
      ],
      // ... other fields
    },
    {
      event: eventPoljskaUkrajina!._id,
      title: 'Stipe Pletikosa',
      description: 'Ovo je Stipe Pletikosa',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693830952/pletikosa_cisptn.webp',
      ],
      // ... other fields
    },
    {
      event: eventPoljskaUkrajina!._id,
      title: 'Niko Kranjčar',
      description: 'Ovo je Niko Kranjčar',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693927733/ds_kranjcar-120608_y1ie1r.jpg',
      ],
      // ... other fields
    },
    {
      event: eventPoljskaUkrajina!._id,
      title: 'Ivica Olić',
      description: 'Ovo je Ivica Olić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693832340/rb_olic-120608_copy_ewwdpj.jpg',
      ],
      // ... other fields
    },
    {
      event: eventBrazil!._id,
      title: 'Marcelo Brozović',
      description: 'Ovo je Marcelo Brozović',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693928266/brozovic%CC%81_pariz_turska_1_fbjdub.jpg',
      ],
      // ... other fields
    },
    {
      event: eventBrazil!._id,
      title: 'Domagoj Vida',
      description: 'Ovo je DOmagoj Vida',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693928183/vida_pozdravlja_navijac%CC%8Ce_3_vx3a9w.jpg',
      ],
      // ... other fields
    },
    {
      event: eventBrazil!._id,
      title: 'Darijo Srna',
      description: 'Ovo je Darijo Srna',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693584256/Darijo_Srna_zkhois.jpg',
      ],
      // ... other fields
    },
    {
      event: eventBrazil!._id,
      title: 'Niko Kovač',
      description: 'Ovo je Niko Kovač',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693927996/Niko_Kovac%CC%8C_12_i3ct1j.jpg',
      ],
      // ... other fields
    },
    {
      event: eventBrazil!._id,
      title: 'Mario Pašalić',
      description: 'Ovo je Mario Pašalić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693928395/pas%CC%8Calic%CC%81_neymar_bltmeb.jpg',
      ],
      // ... other fields
    },
    {
      event: eventBrazil!._id,
      title: 'Ante Rebić',
      description: 'Ovo je Ante Rebić',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693928447/rebic%CC%81_kopenhagen_1_2_d4fflt.jpg',
      ],
      // ... other fields
    },
    {
      event: eventBrazil!._id,
      title: 'Sammir',
      description: 'Ovo je Sammir',
      imageURLs: [
        'https://res.cloudinary.com/dzg5kxbau/image/upload/v1693584480/sammir_kamerun_2_w7dryp.jpg',
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

  const sličicaBadelj = await CardTemplate.findOne({
    title: 'Milan Badelj',
  });

  const sličicaMadzukic = await CardTemplate.findOne({
    title: 'Mario Mandžukić',
  });

  const sličicaSammir = await CardTemplate.findOne({
    title: 'Sammir',
  });

  const sličicaRebic = await CardTemplate.findOne({
    title: 'Ante Rebić',
  });

  const sličicaPasalic = await CardTemplate.findOne({
    title: 'Mario Pašalić',
  });

  const sličicaKovac = await CardTemplate.findOne({
    title: 'Niko Kovač',
  });

  const sličicaSrna = await CardTemplate.findOne({
    title: 'Darijo Srna',
  });

  const sličicaVida = await CardTemplate.findOne({
    title: 'Domagoj Vida',
  });

  const sličicaBrozovic = await CardTemplate.findOne({
    title: 'Marcelo Brozović',
  });

  const sličicaOlic = await CardTemplate.findOne({
    title: 'Ivica Olić',
  });

  const sličicaKranjcar = await CardTemplate.findOne({
    title: 'Niko Kranjčar',
  });

  const sličicaPletikosa = await CardTemplate.findOne({
    title: 'Stipe Pletikosa',
  });

  const sličicaVukojevic = await CardTemplate.findOne({
    title: 'Luka Modrić',
  });

  const sličicaPranjic = await CardTemplate.findOne({
    title: 'Danijel Pranjić',
  });

  const sličicaDaSilva = await CardTemplate.findOne({
    title: 'Eduardo da Silva',
  });

  const sličicaCorluka = await CardTemplate.findOne({
    title: 'Vedran Ćorluka',
  });

  const sličicaBlazevic = await CardTemplate.findOne({
    title: 'Ćiro Blažević',
  });

  const sličicaVlaovic = await CardTemplate.findOne({
    title: 'Goran Vlaović',
  });

  const sličicaStanic = await CardTemplate.findOne({
    title: 'Mario Stanić',
  });

  const sličicaProsinecki = await CardTemplate.findOne({
    title: 'Robert Prosinečki',
  });

  const sličicaLadic = await CardTemplate.findOne({
    title: 'Dražen Ladić',
  });

  const sličicaSuker = await CardTemplate.findOne({
    title: 'Davor Šuker',
  });

  const sličicaVlasic = await CardTemplate.findOne({
    title: 'Nikola Vlašić',
  });

  const sličicaBarisic = await CardTemplate.findOne({
    title: 'Borna Barišić',
  });

  const sličicaSosa = await CardTemplate.findOne({
    title: 'Borna Sosa',
  });
  const sličicaStrinic = await CardTemplate.findOne({
    title: 'Ivan Strinić',
  });

  const sličicaSubasic = await CardTemplate.findOne({
    title: 'Danijel Subašić',
  });

  const sličicaRakitic = await CardTemplate.findOne({
    title: 'Ivan Rakitić',
  });

  const sličicaModric = await CardTemplate.findOne({
    title: 'Luka Modrić',
  });

  const user = await User.findOne({ username: 'testerantonio' });

  // Example data for printed cards
  const printedCardsData = [
    {
      cardTemplate: sličicaLovren!._id,
      qrCode: 'qrCode1',
      isScanned: false,
    },
    {
      cardTemplate: sličicaLovren!._id,
      qrCode: 'qrCode2',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaLivaja!._id,
      qrCode: 'qrCode3',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaLivaja!._id,
      qrCode: 'qrCode4',
      isScanned: false,
    },
    {
      cardTemplate: sličicaKovac!._id,
      qrCode: 'qrCode5',
      isScanned: false,
    },
    {
      cardTemplate: sličicaKovac!._id,
      qrCode: 'qrCode6',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaModric!._id,
      qrCode: 'qrCode7',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaModric!._id,
      qrCode: 'qrCode8',
      isScanned: false,
    },
    {
      cardTemplate: sličicaModric!._id,
      qrCode: 'qrCode9',
      isScanned: false,
    },
    {
      cardTemplate: sličicaSuker!._id,
      qrCode: 'qrCode10',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaSuker!._id,
      qrCode: 'qrCode11',
      isScanned: false,
    },
    {
      cardTemplate: sličicaLadic!._id,
      qrCode: 'qrCode12',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaLadic!._id,
      qrCode: 'qrCode13',
      isScanned: false,
    },
    {
      cardTemplate: sličicaVida!._id,
      qrCode: 'qrCode14',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaVida!._id,
      qrCode: 'qrCode15',
      isScanned: false,
    },
    {
      cardTemplate: sličicaBrozovic!._id,
      qrCode: 'qrCode16',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaBrozovic!._id,
      qrCode: 'qrCode17',
      isScanned: false,
    },
    {
      cardTemplate: sličicaBrozovic!._id,
      qrCode: 'qrCode18',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaSubasic!._id,
      qrCode: 'qrCode19',
      isScanned: false,
    },
    {
      cardTemplate: sličicaSubasic!._id,
      qrCode: 'qrCode20',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaLadic!._id,
      qrCode: 'qrCode21',
      isScanned: false,
    },
    {
      cardTemplate: sličicaProsinecki!._id,
      qrCode: 'qrCode22',
      isScanned: false,
    },
    {
      cardTemplate: sličicaProsinecki!._id,
      qrCode: 'qrCode23',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaCorluka!._id,
      qrCode: 'qrCode24',
      isScanned: false,
    },
    {
      cardTemplate: sličicaCorluka!._id,
      qrCode: 'qrCode25',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaStrinic!._id,
      qrCode: 'qrCode26',
      isScanned: false,
    },
    {
      cardTemplate: sličicaStrinic!._id,
      qrCode: 'qrCode27',
      isScanned: true,
      owner: user!.id,
    },
    {
      cardTemplate: sličicaVlaovic!._id,
      qrCode: 'qrCode28',
      isScanned: false,
    },
    {
      cardTemplate: sličicaVlaovic!._id,
      qrCode: 'qrCode29',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaMadzukic!._id,
      qrCode: 'qrCode30',
      isScanned: false,
    },
    {
      cardTemplate: sličicaMadzukic!._id,
      qrCode: 'qrCode31',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaSrna!._id,
      qrCode: 'qrCode32',
      isScanned: false,
    },
    {
      cardTemplate: sličicaSrna!._id,
      qrCode: 'qrCode33',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaBadelj!._id,
      qrCode: 'qrCode34',
      isScanned: false,
    },
    {
      cardTemplate: sličicaBadelj!._id,
      qrCode: 'qrCode35',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaSammir!._id,
      qrCode: 'qrCode36',
      isScanned: false,
    },
    {
      cardTemplate: sličicaSammir!._id,
      qrCode: 'qrCode37',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaOlic!._id,
      qrCode: 'qrCode38',
      isScanned: false,
    },
    {
      cardTemplate: sličicaOlic!._id,
      qrCode: 'qrCode39',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaRebic!._id,
      qrCode: 'qrCode40',
      isScanned: false,
    },
    {
      cardTemplate: sličicaRebic!._id,
      qrCode: 'qrCode41',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaPasalic!._id,
      qrCode: 'qrCode42',
      isScanned: false,
    },
    {
      cardTemplate: sličicaPasalic!._id,
      qrCode: 'qrCode43',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaKranjcar!._id,
      qrCode: 'qrCode44',
      isScanned: false,
    },
    {
      cardTemplate: sličicaKranjcar!._id,
      qrCode: 'qrCode45',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaPletikosa!._id,
      qrCode: 'qrCode46',
      isScanned: false,
    },
    {
      cardTemplate: sličicaPletikosa!._id,
      qrCode: 'qrCode47',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaVukojevic!._id,
      qrCode: 'qrCode48',
      isScanned: false,
    },
    {
      cardTemplate: sličicaVukojevic!._id,
      qrCode: 'qrCode49',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaPranjic!._id,
      qrCode: 'qrCode50',
      isScanned: false,
    },
    {
      cardTemplate: sličicaPranjic!._id,
      qrCode: 'qrCode51',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaSosa!._id,
      qrCode: 'qrCode52',
      isScanned: false,
    },
    {
      cardTemplate: sličicaSosa!._id,
      qrCode: 'qrCode53',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaDaSilva!._id,
      qrCode: 'qrCode54',
      isScanned: false,
    },
    {
      cardTemplate: sličicaDaSilva!._id,
      qrCode: 'qrCode55',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaVlasic!._id,
      qrCode: 'qrCode56',
      isScanned: false,
    },
    {
      cardTemplate: sličicaVlasic!._id,
      qrCode: 'qrCode57',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaBlazevic!._id,
      qrCode: 'qrCode58',
      isScanned: false,
    },
    {
      cardTemplate: sličicaBlazevic!._id,
      qrCode: 'qrCode59',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaStanic!._id,
      qrCode: 'qrCode60',
      isScanned: false,
    },
    {
      cardTemplate: sličicaStanic!._id,
      qrCode: 'qrCode61',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaBarisic!._id,
      qrCode: 'qrCode62',
      isScanned: false,
    },
    {
      cardTemplate: sličicaBarisic!._id,
      qrCode: 'qrCode63',
      isScanned: true,
      owner: user!._id,
    },
    {
      cardTemplate: sličicaRakitic!._id,
      qrCode: 'qrCode64',
      isScanned: false,
    },
    {
      cardTemplate: sličicaRakitic!._id,
      qrCode: 'qrCode65',
      isScanned: true,
      owner: user!._id,
    },
    // ... other printed cards
  ];

  await PrintedCard.insertMany(printedCardsData);
  console.log('Printed cards seeded successfully!');
};

const seedUserCards = async () => {
  const user = await User.findOne({ username: 'testerantonio' });

  const printedCardqrCode2 = await PrintedCard.findOne({
    qrCode: 'qrCode2',
  });
  const printedCardqrCode6 = await PrintedCard.findOne({
    qrCode: 'qrCode6',
  });
  const printedCardqrCode10 = await PrintedCard.findOne({
    qrCode: 'qrCode10',
  });
  const printedCardqrCode12 = await PrintedCard.findOne({
    qrCode: 'qrCode12',
  });
  const printedCardqrCode16 = await PrintedCard.findOne({
    qrCode: 'qrCode16',
  });
  const printedCardqrCode20 = await PrintedCard.findOne({
    qrCode: 'qrCode20',
  });
  const printedCardqrCode27 = await PrintedCard.findOne({
    qrCode: 'qrCode27',
  });
  const printedCardqrCode31 = await PrintedCard.findOne({
    qrCode: 'qrCode31',
  });
  const printedCardqrCode35 = await PrintedCard.findOne({
    qrCode: 'qrCode35',
  });
  const printedCardqrCode43 = await PrintedCard.findOne({
    qrCode: 'qrCode43',
  });
  const printedCardqrCode45 = await PrintedCard.findOne({
    qrCode: 'qrCode45',
  });
  const printedCardqrCode49 = await PrintedCard.findOne({
    qrCode: 'qrCode49',
  });
  const printedCardqrCode53 = await PrintedCard.findOne({
    qrCode: 'qrCode53',
  });
  const printedCardqrCode57 = await PrintedCard.findOne({
    qrCode: 'qrCode57',
  });
  const printedCardqrCode61 = await PrintedCard.findOne({
    qrCode: 'qrCode61',
  });

  // Create user cards data
  const userCardData = [
    {
      userId: user!._id,
      printedCardId: printedCardqrCode6!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode10!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode12!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode16!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode20!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode27!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode31!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode35!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode43!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode45!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode49!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode53!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode57!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    {
      userId: user!._id,
      printedCardId: printedCardqrCode61!._id, // Reference to a printed card
      addedAt: new Date(),
    },
    // ... other user cards
  ];

  const userCards = await UserCard.insertMany(userCardData);
  console.log('User cards seeded successfully!');

  console.log(
    'carddd ' + userCards.map((userCard: any) => userCard._id)
  );

  // Get the user's album and add the user cards to it
  const album = await Album.findOne({ owner: user!._id });

  if (album) {
    // Map the user cards to their IDs
    const userCardIds = userCards.map(
      (userCard: any) => userCard._id
    );
    //@ts-ignore
    album.cards = userCardIds;
    // Save the album with the updated user card references
    await album.save();
    console.log("User cards added to the user's album successfully!");
  } else {
    console.log("User's album not found.");
  }
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