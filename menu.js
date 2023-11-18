const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

const verifyJWT = (req, res, next) => {
	let header = req.headers.authorization;
	if (!header || !header.startsWith("Bearer"))
		return res.status(201).send({ error: "No valid JWT" });
	const token = header.split(" ")[1];
	jwt.verify(token, secretKey, (err, decoded) => {
		if (err) return res.status(201).send({ error: err.message });
		req.decoded = decoded.email;
		next();
	});
};

router.get("/check", verifyJWT, async (req, res) => {
	res.status(200).send("admin");
});

router.put("/update/:id", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded;
		const itemId = req.params.id;
		const user = await auth.findOne({ email: email });
		let updateData = req.body;

		if (user) {
			const result = await menu.updateOne(
				{ _id: new ObjectId(itemId) },
				{ $set: updateData },
			);
			return res.status(200).send(result);
		}
		res.status(500).send({ error: error.message });
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});

router.post("/create", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded;
		const user = await auth.findOne({ email: email });
		const data = req.body;
		if (user) {
			const result = await menu.insertOne(data);
			return res.status(200).send(result);
		}
		res.status(500).send({ error: error.message });
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});

router.delete("/delete/:id", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded;
		const user = await auth.findOne({ email: email });
		const itemId = req.params.id;
		if (user) {
			const result = await menu.deleteOne({ _id: new ObjectId(itemId) });
			return res.status(200).send(result);
		}
		res.status(500).send({ error: error.message });
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});

router.get("/get", async (req, res) => {
	try {
		const result = await menu.find({}).toArray();
		res.status(200).send(result);
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});

module.exports = router;
