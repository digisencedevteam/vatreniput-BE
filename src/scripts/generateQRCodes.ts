import * as xlsx from 'xlsx';
import CardTemplate from '../api/models/CardTemplate';
import PrintedCard from '../api/models/PrintedCard';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

dotenv.config();

// const MONGODB_URI =
//   'mongodb+srv://vatreni:vatreniputmongodb@serverlessinstance0-vat.hs8h0mi.mongodb.net/?retryWrites=true&w=majority';
const MONGODB_URI = 'mongodb://localhost:27017/vatreniput';
const NUM_ROWS = 62500;
const BASE_URL = 'https://vatreniput.hns.family/card/';
const clientFilePath = './forma5/sheet_92.xlsx';
const TOTAL_RECORDS = 13500;
const RECORDS_PER_FILE = 4500;
const FILES = 3;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

interface OrdinalNumbersWithPositions {
  [key: string]: number;
}

const readClientExcelFile = (
  filePath: string
): [OrdinalNumbersWithPositions, number] => {
  const absoluteFilePath = path.join(__dirname, filePath);
  const workbook = xlsx.readFile(absoluteFilePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const ordinalNumbersWithPositions: OrdinalNumbersWithPositions = {};

  for (let cell in sheet) {
    if (cell[0] === '!') continue;
    const cellValue = sheet[cell].v;
    ordinalNumbersWithPositions[cell] = cellValue;
  }

  const totalColumns = Object.keys(ordinalNumbersWithPositions).length;
  const totalRecords = totalColumns * NUM_ROWS;
  return [ordinalNumbersWithPositions, totalRecords];
};

const processCardByOrdinalNumber = async (ordinalNumber: number) => {
  const cardTemplate = await CardTemplate.findOne({
    ordinalNumber: ordinalNumber,
  });
  if (!cardTemplate) {
    throw new Error('Card Template not found for the given ordinal number');
  }
  const printedCard = await createPrintedCard(cardTemplate._id);
  return printedCard && printedCard._id.toString();
};

const createPrintedCard = async (cardTemplateId: mongoose.Types.ObjectId) => {
  try {
    const newPrintedCard = new PrintedCard({
      cardTemplate: cardTemplateId,
    });
    const test = await newPrintedCard.save();
    console.log('NOVI ZAPIS u printedCards ' + test);
    return newPrintedCard;
  } catch (error) {
    console.error('Error creating printed card:', error);
    return null;
  }
};

const writeToFile = async (
  lines: string[],
  filePath = path.join(__dirname, 'generatedCodesShema1.txt')
) => {
  try {
    const formattedText = lines.join('\n');
    fs.writeFileSync(filePath, formattedText);
    console.log(`Data written to ${filePath}`);
  } catch (error) {
    console.error('Error writing to file:', error);
  }
};

const calculateMaxColumnLengths = (
  ordinalNumbersWithPositions: OrdinalNumbersWithPositions
) => {
  const samplePrintedCardId = new mongoose.Types.ObjectId().toString();
  const baseLength = `${BASE_URL}${samplePrintedCardId}/`.length;

  let maxColumnLengths: { [key: string]: number } = {};
  for (const ordinalNumber in ordinalNumbersWithPositions) {
    maxColumnLengths[ordinalNumber] =
      baseLength + TOTAL_RECORDS.toString().length;
  }
  return maxColumnLengths;
};

const processStickers = async () => {
  const [ordinalNumbersWithPositions] = readClientExcelFile(clientFilePath);
  let globalCounter = 1;

  const maxColumnLengths = calculateMaxColumnLengths(
    ordinalNumbersWithPositions
  );

  const sortedCellRefs = Object.keys(ordinalNumbersWithPositions).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  for (let fileIndex = 0; fileIndex < FILES; fileIndex++) {
    const startingCounter = globalCounter;
    const endingCounter = Math.min(
      startingCounter + RECORDS_PER_FILE - 1,
      TOTAL_RECORDS
    );

    const headerRow = sortedCellRefs
      .map((cellRef) => {
        const header = `Sticker ${ordinalNumbersWithPositions[cellRef]}`;
        return header.padEnd(maxColumnLengths[cellRef], ' ');
      })
      .join('\t');

    const lines = [headerRow];

    while (globalCounter <= endingCounter && globalCounter <= TOTAL_RECORDS) {
      const rowArray = [];
      for (const cellRef of sortedCellRefs) {
        if (globalCounter > TOTAL_RECORDS || globalCounter > endingCounter) {
          break;
        }

        const ordinalNumber = ordinalNumbersWithPositions[cellRef];
        const printedCardId = await processCardByOrdinalNumber(ordinalNumber);
        const formattedCounter = globalCounter
          .toString()
          .padStart(TOTAL_RECORDS.toString().length, '0');
        const urlWithCounter =
          `${BASE_URL}${printedCardId}/${ordinalNumber}`.padEnd(
            maxColumnLengths[cellRef],
            ' '
          );
        rowArray.push(urlWithCounter);
        globalCounter++;
      }
      lines.push(rowArray.join('\t'));
    }

    const filePath = path.join(__dirname, `Sheet-${fileIndex + 1}.txt`);
    await writeToFile(lines, filePath);
  }
};

const run = async () => {
  await connectToDatabase();
  await processStickers();
  mongoose.connection.close();
};
run();
