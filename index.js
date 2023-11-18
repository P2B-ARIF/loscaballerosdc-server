const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const bcrypt = require("bcrypt");

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const auth = require("./auth");
const menu = require("./menu");

app.use("/auth", auth);

app.use("/menu", menu);

app.get("/", (req, res) => {
	res.send("Hello, world...");
});

app.listen(port, () => {
	console.log(`Server listening on ${port}`);
});
