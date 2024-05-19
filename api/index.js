const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const jwt = require("jsonwebtoken");
const GoogleDriveService = require('./googleDriveService.js');
const path = require("path")
const fs = require("fs")

dotenv.config({ path: '../.env' });

const app = express();
const port = 5000;

const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || '';
const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '';

app.use(cors({
  origin: '*'
}));

app.use(bodyParser.json());

const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

async function run() {
  try {
    // const database = client.db('sample_mflix');
    // const movies = database.collection('movies');

    // // Query for a movie that has the title 'Back to the Future'
    // const query = { title: 'Back to the Future' };
    // const movie = await movies.findOne(query);

    console.log("idhar");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
console.log(process.env.GOOGLE_DRIVE_CLIENT_ID);
console.log(process.env.GOOGLE_DRIVE_CLIENT_SECRET);
console.log(process.env.GOOGLE_DRIVE_REDIRECT_URI);
console.log(process.env.GOOGLE_DRIVE_REFRESH_TOKEN);
(async () => {
  const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);
  const finalPath = path.resolve(__dirname, '../Frame34.svg');
  const folderName = 'Picture';

  if (!fs.existsSync(finalPath)) {
    throw new Error('File not found!');
  }
  
  let folder = await googleDriveService.searchFolder(folderName).catch((error) => {
    console.error(error);
    return null;
  });
  
  if (!folder) {
    folder = await googleDriveService.createFolder(folderName);
  }
  
  await googleDriveService.saveFile('SpaceX', finalPath, 'image/jpg', folder.id).catch((error) => {
    console.error(error);
  });

  console.info('File uploaded successfully!');

  // Delete the file on the server
  fs.unlinkSync(finalPath);
})();
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
