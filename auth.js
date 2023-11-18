const express = require("express");
const router = express.Router();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// const uri = process.env.MONGODB_URL;
const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;
const secretKey = process.env.JWT_SECRET;

const uri = `mongodb+srv://${username}:${password}@cluster0.wyoolmo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

const db = client.db("los_caballeros");
const auth = db.collection("auth");
const menu = db.collection("menu");

router.post("/login", async (req, res) => {
	try {
		const data = req.body;
		const { email, password } = data;
		if (!email || !password) {
			return res.status(403).send({ error: "Email and Password are required" });
		}
		const user = await auth.findOne({ email: data.email });

		if (user?.email === "admin@gmail.com") {
			bcrypt.compare(data.password, user.password, (err, result) => {
				if (err) {
					console.error("Error comparing passwords:", err.message);
					return;
				}
				if (result === true) {
					jwt.sign(user, secretKey, { expiresIn: "10h" }, (err, token) => {
						if (err) {
							console.error("Error creating JWT token:", err.message);
							res.status(500).json({ error: "Internal Server Error" });
						} else {
							return res.status(201).send({ token });
						}
					});
					console.log("Password matched. User authenticated!");
				} else {
					res
						.status(500)
						.json({ message: "Password did not match. Access denied." });
				}
			});
		} else {
			res
				.status(500)
				.json({ message: "Please enter valid admin dashboard email" });
		}
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});

module.exports = router;
