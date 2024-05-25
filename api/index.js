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

// app.use(cors({
// 	origin: 'https://match-karao.vercel.app'
// }));

app.use(cors())
app.use(bodyParser.json());

const { MongoClient, ObjectId } = require("mongodb");

// Replace the uri string with your connection string.
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

app.post("/login", async (req, res) => {
	try {

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

				res.status(200).json({ message: token, type: "Success", teamID: result[0]._id });

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

app.post('/addTeamMembers', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const { teamName, teamID, playersInformation } = req.body;
		const collection = db.collection('TeamMembers');
		collection.find({ teamName: teamName }).toArray().then(async (result) => {
			if (result && result.length > 0) {
				res.status(200).json({ message: "Team already exists", type: "Failed" });
			} else {
				const result = await collection.insertOne({
					teamName: teamName,
					teamID: teamID,
					teamMembers: playersInformation
				}).catch((error) => {
					console.error(error)
					res.status(500).json({ message: "Failed to Add Team Players", type: "Failure" })
				})

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
app.post('/createNewBooking', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const { bookingType, teamID, location, date, startTime, endTime, price, venue } = req.body;

		const collection = db.collection(bookingType);
		await collection.insertOne({
			teamID: teamID,
			bookingType: bookingType,
			location: location,
			date: date,
			startTime: startTime,
			endTime: endTime,
			price: price,
			venue: venue,
			bookingConfirmation: "false"
		}).catch((error) => {
			console.error(error)
			res.status(500).json({ message: "Failed to Create Booking", type: "Failure" })
		})
		res.status(200).json({ message: "Booking successfully Created", type: "Success" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})
app.get('/getHalfBookings', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const collection = db.collection('Half Booking');
		collection.find().toArray().then(async (result) => {
			const credentials = db.collection("Credentials")
			for (var i = 0; i < result.length; i++) {
				const objectId = new ObjectId(result[i].teamID);
				const query = { _id: objectId };
				const bruh = await credentials.findOne(query);
				result[i]["image"] = bruh["image"]
				result[i]["teamName"] = bruh["teamName"]
				if("teamTwoID" in result[i]){
					const objectId = new ObjectId(result[i].teamTwoID);
					const query = { _id: objectId };
					const lol = await credentials.findOne(query);
					result[i]["teamTwoImage"] =  lol["image"]
					result[i]["teamTwoName"] = lol["teamName"]
				}
			}
			res.status(200).json({ type: "Success", result: result })
		}).catch((error) => {
			console.error(error);
			res.status(500).json({ message: 'Internal Server Error' });
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
});
app.get('/getFullBookings', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const collection = db.collection('Full Booking');
		collection.find().toArray().then(async (result) => {
			const credentials = db.collection("Credentials")
			for (var i = 0; i < result.length; i++) {
				const objectId = new ObjectId(result[i].teamID);
				const query = { _id: objectId };
				const bruh = await credentials.findOne(query);
				result[i]["image"] = bruh["image"]
				result[i]["teamName"] = bruh["teamName"]
			}
			res.status(200).json({ type: "Success", result: result })
		}).catch((error) => {
			console.error(error);
			res.status(500).json({ message: 'Internal Server Error' });
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
});
app.post('/filterBookings', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const { location, date, startTime, endTime } = req.body;

		const collection = db.collection("Half Booking");
		const query = {};

		if (location) {
			query.location = location;
		}
		if (date) {
			query.date = date;
		}
		if (startTime) {
			query.startTime = { $gte: startTime };
		}
		if (endTime) {
			query.endTime = { $lte: endTime };
		}
		const results = await collection.find(query).toArray();
		const credentials = db.collection("Credentials")
		for (var i = 0; i < results.length; i++) {
			const objectId = new ObjectId(results[i].teamID);
			const query = { _id: objectId };
			const bruh = await credentials.findOne(query);
			results[i]["image"] = bruh["image"]
			results[i]["teamName"] = bruh["teamName"]
			if("teamTwoID" in results[i]){
				const objectId = new ObjectId(results[i].teamTwoID);
				const query = { _id: objectId };
				const lol = await credentials.findOne(query);
				results[i]["teamTwoImage"] =  lol["image"]
				results[i]["teamTwoName"] = lol["teamName"]
			}
		}
		res.status(200).json({ results: results, type: "Success" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})
app.post('/askToPlay', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const { price, teamOneID, teamTwoID, location, date, startTime, endTime, venue, ticketID } = req.body;

		const collection = db.collection("Notification");
		await collection.insertOne({
			type: "1",
			teamOneID: teamOneID,
			teamTwoID: teamTwoID,
			venue: venue,
			price: price,
			date: date,
			location: location,
			startTime: startTime,
			endTime: endTime,
			ticketID: ticketID
		}).catch((error) => {
			console.error(error)
			res.status(500).json({ message: "Failed to Send Notification", type: "Failure" })
		})

		res.status(200).json({ message: "Booking successfully Created", type: "Success" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})
app.post('/getNotifications', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const { teamID } = req.body;
		const collection = db.collection("Notification");
		const results = await collection.find({ teamOneID: teamID, "type": "1" }).toArray();
		const resultsTwo = await collection.find({ teamTwoID: teamID, "type": "2" }).toArray();
		const credentials = db.collection("Credentials")
		var finalResults = [];
		for (var i = 0; i < results.length; i++) {
			const objectId = new ObjectId(results[i].teamTwoID);
			const query = { _id: objectId };
			const bruh = await credentials.findOne(query);
			if (bruh)
				results[i]["teamName"] = bruh["teamName"]
			finalResults.push(results[i]);
		}
		for (var i = 0; i < resultsTwo.length; i++) {
			const objectId = new ObjectId(resultsTwo[i].teamOneID);
			const query = { _id: objectId };
			const bruh = await credentials.findOne(query);
			if (bruh)
				resultsTwo[i]["teamName"] = bruh["teamName"]
			finalResults.push(resultsTwo[i]);
		}

		res.status(200).json({ notifications: finalResults, type: "Success" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})
app.post('/getNotificationsExist', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const { teamID } = req.body;
		const collection = db.collection("Notification");
		;
		const results = await collection.find({ teamOneID: teamID }).toArray();
		res.status(200).json({ notifications: results.length != 0, type: "Success" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})
app.post('/acceptPlayRequest', async (req, res) => {
	try {
		const db = client.db("MatchKarao")

		const { notification } = req.body;
		const collection = db.collection("Notification");
		const creds = db.collection("Credentials");
		const teamOne = await creds.findOne({ _id: new ObjectId(notification.teamOneID) })
		await collection.deleteMany({ ticketID: notification.ticketID });
		const results = await collection.insertOne({
			type: "2",
			teamOneID: notification.teamOneID,
			teamTwoID: notification.teamTwoID,
			teamName: teamOne["teamName"],
			venue: notification.venue,
			price: notification.price,
			date: notification.date,
			location: notification.location,
			startTime: notification.startTime,
			endTime: notification.endTime,
		})
		const halfBookingCollection = db.collection("Half Booking");
		await halfBookingCollection.updateOne({ _id: new ObjectId(notification.ticketID) },
			{ $set: { teamTwoID: notification.teamTwoID, bookingConfirmation: "true"  } }).catch((error) => {
				console.error(error);
				res.status(500).json({ message: "Failed to Delete Old Booking", type: "Failure" })
			})
		res.status(200).json({ result: results, type: "Success" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})
app.post('/removePlayRequest', async (req, res) => {
	try {
		const db = client.db("MatchKarao")
		const { id } = req.body;
		const collection = db.collection("Notification");
		await collection.deleteMany({ _id: new ObjectId(id) });
		res.status(200).json({ type: "Success" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})
app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
