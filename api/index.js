const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');;
const dotenv = require('dotenv');
const jwt = require("jsonwebtoken");
dotenv.config({ path: '../.env' });

const app = express();
const port = 5000;

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


  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
