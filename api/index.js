const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const jwt = require("jsonwebtoken");
const GoogleDriveService = require('./googleDriveService.js');
const path = require("path")
const fs = require("fs")
const crypto = require("crypto")
const secretKey = "Haider_Ali_Rizvi_Chishti_Achakzai"

dotenv.config({ path: '../.env' });

const app = express();
const port = 5000;

const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || '';
const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '';

app.use(cors());

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
		// await client.close();
	}
}
run().catch(console.dir);
console.log(process.env.GOOGLE_DRIVE_CLIENT_ID);
console.log(process.env.GOOGLE_DRIVE_CLIENT_SECRET);
console.log(process.env.GOOGLE_DRIVE_REDIRECT_URI);
console.log(process.env.GOOGLE_DRIVE_REFRESH_TOKEN);
async function uploadFileToDrive() {
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

}
app.post("/login", async (req, res) => {
	try {
		console.log("trynna log in")
	  const {teamName, password} = req.body;
	  const db = client.db("MatchKarao")
	  const collection = db.collection('Credentials');
	  const md5Hash = crypto.createHash('md5').update(password).digest('hex');
	  collection.find({teamName: teamName}).toArray().then((result) => {
		if (!result || result.length == 0) {
		  res.status(200).json({ message: "Invalid username or password. Please try again.", type:"Failed" });
		  return;
		}
		  if(result[0].teamName == teamName && result[0].password == md5Hash){
			const token = jwt.sign({ userId: teamName }, secretKey, { expiresIn: '1h' });
			console.log("Returning success status")
			res.status(200).json({ message: token, type:"Success" }); 
			console.log("mubarak")
		  }else{
			res.status(200).json({message: "Invalid username or password. Please try again.", type:"Failed"})
		  }
	  }).catch((error) => {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	  });
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ message: 'Internal Server Error' });
	}
	});
	app.post('/verifyJWT', async (req, res) => {
		try{
		  const {jwtToken} = req.body;
		  let decodedToken;
		  if(!jwtToken){
			res.status(200).json({ message: 'Invalid JWT Token', type:"Failed"});
			return;
		  }
		  try{
			decodedToken = jwt.verify(jwtToken, secretKey);
		  }catch(error){
			console.error(error);
			res.status(200).json({ message: 'Invalid JWT Token', type:"Failed"});
			return;
		  }
		  res.status(200).json({ message: decodedToken , type:"Success"});
		}catch(error){
		  console.error(error);
		  res.status(500).json({ message: 'Internal Server Error' });
		}
	  });
	  
app.post('/register', (req, res) => {
    try {
		const db = client.db("MatchKarao")
        const {teamName, password} = req.body;
        const collection = db.collection('Credentials');
        const md5Hash = crypto.createHash('md5').update(password).digest('hex');
        collection.find({teamName: teamName}).toArray().then((result) => {
        if(result && result.length > 0){
            res.status(200).json({ message: "User already exists", type:"Failed" });
        }else{
            collection.insertOne({teamName: teamName, password: md5Hash}).then(()=>{
                    res.status(200).json({ message: "User registered successfully", type:"Success" });
            })            
        }
        }).catch((error) => {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})



app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
