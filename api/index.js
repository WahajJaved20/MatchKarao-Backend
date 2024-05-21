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

// app.use(cors({
// 	origin: 'https://match-karao.vercel.app'
// }));

app.use(cors())
app.use(bodyParser.json());

const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

async function uploadFileToDrive(folderNamse, fileName) {
	const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);
	const finalPath = path.resolve(__dirname, '../Frame34.svg');
	const folderName = folderNamse;

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
		const { teamName, password } = req.body;
		const db = client.db("MatchKarao")
		const collection = db.collection('Credentials');
		const md5Hash = crypto.createHash('md5').update(password).digest('hex');
		collection.find({ teamName: teamName }).toArray().then((result) => {
			if (!result || result.length == 0) {
				res.status(200).json({ message: "Invalid username or password. Please try again.", type: "Failed" });
				return;
			}
			if (result[0].teamName == teamName && result[0].password == md5Hash) {
				const token = jwt.sign({ userId: teamName }, secretKey, { expiresIn: '1h' });
				console.log("Returning success status")
				res.status(200).json({ message: token, type: "Success" });
				console.log("mubarak")
			} else {
				res.status(200).json({ message: "Invalid username or password. Please try again.", type: "Failed" })
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
	try {
		const { jwtToken } = req.body;
		let decodedToken;
		if (!jwtToken) {
			res.status(200).json({ message: 'Invalid JWT Token', type: "Failed" });
			return;
		}
		try {
			decodedToken = jwt.verify(jwtToken, secretKey);
		} catch (error) {
			console.error(error);
			res.status(200).json({ message: 'Invalid JWT Token', type: "Failed" });
			return;
		}
		res.status(200).json({ message: decodedToken, type: "Success" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
});

app.post('/register', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const formData = req.body;
		const { teamName, password, confirmPassword, location, image } = formData;
		const collection = db.collection('Credentials');
		const md5Hash = crypto.createHash('md5').update(password).digest('hex');
		collection.find({ teamName: teamName }).toArray().then(async (result) => {
			if (result && result.length > 0) {
				res.status(200).json({ message: "User already exists", type: "Failed" });
			} else {
				const result = await collection.insertOne({
					teamName: teamName,
					password: md5Hash,
					confirmPassword: confirmPassword,
					location: location,
					image: image
				}).catch((error) => {
					console.error(error)
					res.status(500).json({ message: "Failed to Add user", type: "Failure" })
				})
				console.log(result.insertedId)
				res.status(200).json({ message: "User registered successfully", type: "Success", docID: result.insertedId });
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
