import * as xlsx from 'xlsx';
import CardTemplate from '../api/models/CardTemplate';
import PrintedCard from '../api/models/PrintedCard';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

dotenv.config();

//const MONGODB_URI = 'mongodb://localhost:27017/vatreniput'
const MONGODB_URI = 'mongodb+srv://vatreni:vatreniputmongodb@serverlessinstance0-vat.hs8h0mi.mongodb.net/?retryWrites=true&w=majority'
const NUM_ROWS = 100;  
const BASE_URL = 'https://vatreniput-fe.vercel.app/card/';
const clientFilePath = './testShema4.xlsx';
const exampleFullUrl = 'https://vatreniput-fe.vercel.app/card/656771d40d0578cd46fbb6c6';
const urlLength = exampleFullUrl.length;

const padHeader = (header: any) => {
    const paddingNeeded = urlLength - header.length;
    return header + ' '.repeat(paddingNeeded);
};

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

const readClientExcelFile = (filePath: string): OrdinalNumbersWithPositions => {
    const absoluteFilePath = path.join(__dirname, filePath);
    const workbook = xlsx.readFile(absoluteFilePath);
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const ordinalNumbersWithPositions: OrdinalNumbersWithPositions = {};

    for (let cell in sheet) {
        if(cell[0] === '!') continue;
        const cellValue = sheet[cell].v;
        ordinalNumbersWithPositions[cell] = cellValue;
    }
    return ordinalNumbersWithPositions;
};

const processCardByOrdinalNumber = async (ordinalNumber: number) => {
    const cardTemplate = await CardTemplate.findOne({ ordinalNumber: ordinalNumber });
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
        console.log('printed ' + test)
        return newPrintedCard;
    } catch (error) {
        console.error('Error creating printed card:', error);
        return null; 
    }
};

const writeToFile = async (lines: string[], filePath = path.join(__dirname, 'generatedCodesShema4.txt')) => {
    try {
        const formattedText = lines.join('\n');
        fs.writeFileSync(filePath, formattedText);
        console.log(`Data written to ${filePath}`);
    } catch (error) {
        console.error('Error writing to file:', error);
    }
};

const processStickers = async () => {
    const ordinalNumbersWithPositions = readClientExcelFile(clientFilePath);
    const headerRow = Object.keys(ordinalNumbersWithPositions)
                            .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))
                            .map(cellRef => padHeader(`Sticker ${ordinalNumbersWithPositions[cellRef]}`));
    const lines = [headerRow.join('\t')];

    for (let rowIndex = 0; rowIndex < NUM_ROWS; rowIndex++) {
        const uuids = await Promise.all(
            Object.keys(ordinalNumbersWithPositions)
                .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))
                .map(async cellRef => {
                    const ordinalNumber = ordinalNumbersWithPositions[cellRef];
                    const printedCardId = await processCardByOrdinalNumber(ordinalNumber);
                    return BASE_URL + printedCardId; 
                })
        );
        lines.push(uuids.join('\t'));
    }
    await writeToFile(lines);
};

const run = async () => {
    await connectToDatabase();
    await processStickers();
    mongoose.connection.close();
};
run();


