import 'reflect-metadata';
import express from 'express';
import mongoose, { ConnectOptions } from 'mongoose';
import { useExpressServer } from 'routing-controllers';

const app = express();

// Connect to MongoDB
const mongoOptions: ConnectOptions = {};
const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 3001;
const controllerExtension = process.env.CONTROLLER_EXTENSION || 'ts';
const controllerPath = `${__dirname}/controllers/**/*Controller${controllerExtension}`;

mongoose
  .connect(uri || '', mongoOptions)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
  });
console.log('Loading controllers from path: ' + controllerPath);

useExpressServer(app, {
  controllers: [controllerPath],
});

app.listen(port, () => {
  console.log('Server is running on ' + port);
});
