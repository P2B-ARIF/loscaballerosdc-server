const express = require("express");
const router = express.Router();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { format } = require("date-fns");

const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

// ? database
const adminDatabase = client.db("admin_dashboard");
const userDatabase = client.db("users_dashboard");

// ? admin collection
const deposit_admin_History = adminDatabase.collection("deposit_history");
const withdraw_admin_History = adminDatabase.collection("withdraw_history");
const earningAdminTable = adminDatabase.collection("earnings_table");
const controller = adminDatabase.collection("controllers");

// ? user collection
const userDepositPending = userDatabase.collection("deposit_history");
const userWithdrawPending = userDatabase.collection("withdraw_history");
const packageCollection = userDatabase.collection("package_history");
const reviewCollection = userDatabase.collection("reviews");
const historyCollection = userDatabase.collection("history");


const usersCollection = userDatabase.collection("users");
const testsCollection = userDatabase.collection("tests");
// const adminCollection = database.collection('')

const verifyBodyJWT = async (req, res, next) => {
	const authToken = req.body.token;
	console.log(authToken);
	if (!authToken) {
		return res.status(500).send({ message: "Invalid authorization header" });
	}
	const token = authToken.split(" ")[1];
	if (!token) {
		return res.status(403).send({ message: "unauthorized access token" });
	}
	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) {
			return res
				.status(403)
				.send({ message: "expired token clear data browser" });
		}
		if (decoded.userEmail === "mohammadarif4319@gmail.com") {
			req.userEmail = decoded.userEmail;
			next();
		}
		res.status(403).send({ message: "unauthorized get data access" });
	});
};
const verifyHeadersJWT = async (req, res, next) => {
	const authToken = req.headers.authentication;
	if (!authToken) {
		return res.status(500).send({ message: "Invalid authorization header" });
	}
	const token = authToken.split(" ")[1];

	if (!token) {
		return res.status(403).send({ message: "unauthorized access token" });
	}
	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) {
			return res
				.status(403)
				.send({ access: false, message: "expired token clear data browser" });
		}
		if (decoded.userEmail === "mohammadarif4319@gmail.com") {
			req.userEmail = decoded.userEmail;
			next();
		} else {
			res.status(403).send({ message: "unauthorized get data access" });
		}
	});
};

router.put("/reset", async (req, res) => {
	const a = await testsCollection.updateMany(
		{},
		{ $set: { balance: 0 } },
		{ upsert: true },
	);
	res.send(a);
});

// router.put("/verified", async (req, res) => {
// 	try {
// 		let uid = 10;
// 		let referID = 0;
// 		let amount = 180;
// 		let percentage = 2.3;
// 		const email = "abc@gmail.com";
// 		const accountOwner = await testsCollection.updateOne(
// 			{ uid: uid },
// 			{ $set: { verified: true } },
// 			{ upsert: true },
// 		);
// 		const referrerUser = await testsCollection.findOne({ uid: uid });
// 		referID = referrerUser.referID;

// 		for (let i = 0; i < 10; i++) {
// 			const referrerUser = await testsCollection.findOne({ uid: referID });
// 			if (referrerUser) {
// 				const accountOwner = await testsCollection.updateOne(
// 					{ uid: referID },
// 					{
// 						$inc: { balance: +amount.toFixed(2) },
// 					},
// 					{ upsert: true },
// 				);
// 				referID = referrerUser.referID;
// 				amount = amount / percentage;
// 				console.log(amount);
// 			}
// 			// if (el.referID) {
// 			// 	console.log(el);
// 			// 	let a = data.find(s => s.id === el.referID);
// 			// 	a.money + ((el.money * 25) % console.log(a));
// 			// }
// 		}
// 		const find = await testsCollection.find({}).toArray();
// 		res.send({ find, accountOwner, referrerUser });
// 	} catch (error) {
// 		console.log(error);
// 	}
// });

router.put("/actionReq", async (req, res) => {
	try {
		console.log(req.body);
		if (req.body.status === "completed") {
			const actionReq = await packReqCollection.deleteOne({
				email: req.body.email,
			});
			const packDone = await usersCollection.updateOne(
				{ email: req.body.email },
				{
					$set: { package: req.body.package_name },
					$set: { workExpired: +30 },
					$unset: { "requested.package": "" },
				},

				{ upsert: true },
			);
			const packHis = await packHisCollection.insertOne({
				email: req.body.email,
				package_name: req.body.package_name,
				status: "completed",
				createdAt: new Date(),
			});

			res.send({ actionReq, packDone, packHis });
		} else if (req.body.status === "processing") {
			const actionReq = await usersCollection.updateOne(
				{ email: req.body.email },
				{ $set: { "requested.package": req.body.status } },
				{ upsert: true },
			);
			const statusUsers = await packReqCollection.updateOne(
				{ email: req.body.email },
				{
					$set: { status: req.body.status },
				},
				{ upsert: true },
			);
			// const actionReq = await packReqCollection.updateOne({
			// 	email: req.body.email,
			// });
			res.send({ actionReq, statusUsers });
		}
	} catch (error) {
		console.log(error);
	}
});

router.get("/packReq", async (req, res) => {
	try {
		const packReq = await packReqCollection.find({}).toArray();
		res.send(packReq);
	} catch (error) {
		console.log(error);
	}
});

router.put("/package", async (req, res) => {
	try {
		const { email, p } = req.query;
		const result = await accountsCollection.updateOne(
			{ email: email },
			{ $set: { package: p } },
		);
		console.log({ email, p, result });
		res.send(result);
	} catch (error) {
		console.log(error);
	}
});

// ? update review status
router.put("/put/reviews_status", verifyHeadersJWT, async (req, res) => {
	try {
		const id = req.query.id;
		const status = req.query.status;
		if (status === "check") {
			const actionCheck = await reviewCollection.updateOne(
				{
					_id: new ObjectId(id),
				},
				{
					$set: { status: "success" },
				},
			);
			res.status(200).send(actionCheck);
		} else {
			const actionCancel = await reviewCollection.updateOne(
				{
					_id: new ObjectId(id),
				},
				{
					$set: { status: "cancel" },
				},
			);
			res.status(200).send(actionCancel);
		}
	} catch (err) {
		res.status(500).send(err.message);
	}
});

// ? get package history
router.get("/get/packHistory", verifyHeadersJWT, async (req, res) => {
	try {
		const packHistory = await packageCollection
			.find({})
			.sort({ "createdAt.date": -1 })
			.toArray();
		res.status(201).send(packHistory);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get user reviews
router.get("/get/reviews", async (req, res) => {
	try {
		const review = await reviewCollection
			.find({})
			.sort({ "data.data_fns": -1 })
			.toArray();
		res.status(200).send(review);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

// ? get clicked from admin collection
// router.get("/get/clicked", async (req, res) => {
// 	try {
// 		const today = format(new Date(), "P");
// 		const yesterday = format(
// 			new Date(new Date().setDate(new Date().getDate() - 1)),
// 			"P",
// 		);
// 		const last7days = format(
// 			new Date(new Date().setDate(new Date().getDate() - 7)),
// 			"P",
// 		);
// 		const last30days = format(
// 			new Date(new Date().setDate(new Date().getDate() - 30)),
// 			"P",
// 		);
// 		const thisMonth = format(
// 			new Date(new Date().setDate(new Date().getMonth() - 1)),
// 			"P",
// 		);
// 		const lastMonth = format(
// 			new Date(new Date().setDate(new Date().getMonth() - 30)),
// 			"P",
// 		);

// 		const getToday = await earningAdminTable
// 			.find({
// 				"date.date_fns": today,
// 			})
// 			.toArray();
// 		const getYesterday = await earningAdminTable
// 			.find({
// 				"date.date_fns": yesterday,
// 			})
// 			.toArray();
// 		const getLast7days = await earningAdminTable
// 			.find({
// 				"date.date_fns": {
// 					$gte: last7days,
// 					$lte: today,
// 				},
// 			})
// 			.toArray();
// 		const getLast30days = await earningAdminTable
// 			.find({
// 				"date.date_fns": {
// 					$gte: last30days,
// 					$lte: today,
// 				},
// 			})
// 			.toArray();
// 		const getThisMonth = await earningAdminTable
// 			.find({
// 				"date.date_fns": {
// 					$gte: thisMonth,
// 					$lte: today,
// 				},
// 			})
// 			.toArray();
// 		const getLastMonth = await earningAdminTable
// 			.find({
// 				"date.date_fns": {
// 					$gte: lastMonth,
// 					$lte: thisMonth,
// 				},
// 			})
// 			.toArray();

// 		let getTodayCount = 0;
// 		let getYesterdayCount = 0;
// 		let getLast7daysCount = 0;
// 		let getLast30daysCount = 0;
// 		let getThisMonthCount = 0;
// 		let getLastMonthCount = 0;

// 		getToday?.map(click => {
// 			getTodayCount += click.clicked;
// 		});

// 		getYesterday?.map(click => {
// 			getYesterdayCount += click.clicked;
// 		});

// 		getLast7days?.map(click => {
// 			getLast7daysCount += click.clicked;
// 		});

// 		getLast30days?.map(click => {
// 			getLast30daysCount += click.clicked;
// 		});

// 		getThisMonth?.map(click => {
// 			getThisMonthCount += click.clicked;
// 		});

// 		getLastMonth?.map(click => {
// 			getLastMonthCount += click.clicked;
// 		});
// 		res.status(201).send({
// 			getTodayCount,
// 			getYesterdayCount,
// 			getLast7daysCount,
// 			getLast30daysCount,
// 			getThisMonthCount,
// 			getLastMonthCount,
// 		});
// 	} catch (err) {
// 		res.status(500).send({ message: err.message });
// 	}
// });

// ? get total balance, deposit, withdraw, earned and total refer income of all accounts
router.get("/get/total_count", verifyHeadersJWT, async (req, res) => {
	try {
		let totalBalance = 0;
		let totalDeposit = 0;
		let totalWithdraw = 0;
		let totalEarned = 0;
		let totalReferIncome = 0;

		const total = await usersCollection.find({}).toArray();
		// const totalClicked = await usersCollection.find({}).toArray();
		total.map(u => {
			totalBalance += u.balance;
			if (u?.total?.deposit) {
				totalDeposit += u?.total?.deposit;
			}
			if (u?.total?.withdraw) {
				totalWithdraw += u?.total?.withdraw;
			}
			if (u?.total?.earned) {
				totalEarned += u?.total?.earned;
			}
			if (u?.total?.referIncome) {
				totalReferIncome += u?.total?.referIncome;
			}
		});

		const today = format(new Date(), "P");
		const yesterday = format(
			new Date(new Date().setDate(new Date().getDate() - 1)),
			"P",
		);
		const last7days = format(
			new Date(new Date().setDate(new Date().getDate() - 7)),
			"P",
		);
		const last30days = format(
			new Date(new Date().setDate(new Date().getDate() - 30)),
			"P",
		);
		const thisMonth = format(
			new Date(new Date().setDate(new Date().getMonth() - 1)),
			"P",
		);
		const lastMonth = format(
			new Date(new Date().setDate(new Date().getMonth() - 30)),
			"P",
		);

		const getToday = await earningAdminTable
			.find({
				"date.date_fns": today,
			})
			.toArray();
		const getYesterday = await earningAdminTable
			.find({
				"date.date_fns": yesterday,
			})
			.toArray();
		const getLast7days = await earningAdminTable
			.find({
				"date.date_fns": {
					$gte: last7days,
					$lte: today,
				},
			})
			.toArray();
		const getLast30days = await earningAdminTable
			.find({
				"date.date_fns": {
					$gte: last30days,
					$lte: today,
				},
			})
			.toArray();
		const getThisMonth = await earningAdminTable
			.find({
				"date.date_fns": {
					$gte: thisMonth,
					$lte: today,
				},
			})
			.toArray();
		const getLastMonth = await earningAdminTable
			.find({
				"date.date_fns": {
					$gte: lastMonth,
					$lte: thisMonth,
				},
			})
			.toArray();

		const getTotal = await earningAdminTable.find({}).toArray();

		let getTodayCount = 0;
		let getYesterdayCount = 0;
		let getLast7daysCount = 0;
		let getLast30daysCount = 0;
		let getThisMonthCount = 0;
		let getLastMonthCount = 0;
		let getTotalClicked = 0;

		getToday?.map(click => {
			getTodayCount += click.clicked;
		});

		getYesterday?.map(click => {
			getYesterdayCount += click.clicked;
		});

		getLast7days?.map(click => {
			getLast7daysCount += click.clicked;
		});

		getLast30days?.map(click => {
			getLast30daysCount += click.clicked;
		});

		getThisMonth?.map(click => {
			getThisMonthCount += click.clicked;
		});

		getLastMonth?.map(click => {
			getLastMonthCount += click.clicked;
		});
		getTotal?.map(click => {
			getTotalClicked += click.clicked;
		});
		// res.status(201).send({
		// 	getTodayCount,
		// 	getYesterdayCount,
		// 	getLast7daysCount,
		// 	getLast30daysCount,
		// 	getThisMonthCount,
		// 	getLastMonthCount,
		// });

		res.status(200).send({
			totalWithdraw,
			totalReferIncome,
			totalBalance,
			totalDeposit,
			totalEarned,
			getTodayCount,
			getYesterdayCount,
			getLast7daysCount,
			getLast30daysCount,
			getThisMonthCount,
			getLastMonthCount,
			getTotalClicked,
		});
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

// ? get all pending length
router.get("/get/pending_success", verifyHeadersJWT, async (req, res) => {
	try {
		const depositPending = await userDepositPending
			.find({ status: "pending" })
			.toArray();
		const withdrawPending = await userWithdrawPending
			.find({ status: "pending" })
			.toArray();

		const depositCancel = await deposit_admin_History
			.find({ status: "cancel" })
			.toArray();

		const depositSuccess = await userDepositPending
			.find({ status: "success" })
			.toArray();
		const withdrawSuccess = await userWithdrawPending
			.find({ status: "success" })
			.toArray();

		res.status(201).send({
			depositPending: depositPending.length,
			withdrawPending: withdrawPending.length,
			depositCancel: depositCancel.length,
			depositSuccess: depositSuccess.length,
			withdrawSuccess: withdrawSuccess.length,
		});
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

// ? get all total length
router.get("/get/totalLength", verifyHeadersJWT, async (req, res) => {
	try {
		const user = await usersCollection.find({}).toArray();
		const verifiedUser = await usersCollection
			.find({ verified: true })
			.toArray();

		res.status(201).send({ user: user.length, verified: verifiedUser.length });
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

// ? get all total balance
router.get("/get/totalAllBalance", verifyHeadersJWT, async (req, res) => {
	try {
		const user = await usersCollection.find({}).toArray();
		if (user?.total === undefined) {
			res.status(500).send({ message: "there are no have total balance" });
		}
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

// ? toggle message status
router.put("/toggle/message", verifyHeadersJWT, async (req, res) => {
	try {
		const status = req.body.status;
		const findStatus = await controller.findOne({ "message.status": true });
		if (findStatus && status) {
			const toggle = await controller.updateOne(
				{
					_id: new ObjectId("6415ced6b739c27e8fbfe54f"),
				},
				{ $set: { "message.status": false } },
			);
			return res.status(200).send({ toggle });
		} else {
			const toggle = await controller.updateOne(
				{
					_id: new ObjectId("6415ced6b739c27e8fbfe54f"),
				},
				{ $set: { "message.status": true } },
			);
			return res.status(200).send({ toggle });
		}
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? handle new message
router.put("/add/message", verifyHeadersJWT, async (req, res) => {
	try {
		const sms = req.body.message;
		const added = await controller.updateOne(
			{
				_id: new ObjectId("6415ced6b739c27e8fbfe54f"),
			},
			{ $set: { "message.sms": sms } },
		);
		return res.status(200).send(added);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? action add website link
router.put("/add/website_link", verifyHeadersJWT, async (req, res) => {
	try {
		const link = req.body.newLink;
		const find = await controller.findOne({ websiteLink: link });
		if (find === null) {
			const added = await controller.updateOne(
				{
					_id: new ObjectId("6415ced6b739c27e8fbfe54f"),
				},
				{ $push: { websiteLink: link } },
			);
			return res.status(200).send(added);
		} else {
			res.status(500).send({ message: "this link already exits!" });
		}
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? delete website link
router.put("/delete/website_link", verifyHeadersJWT, async (req, res) => {
	try {
		const link = req.body.link;
		const deleted = await controller.updateOne(
			{
				_id: new ObjectId("6415ced6b739c27e8fbfe54f"),
			},
			{ $pull: { websiteLink: link } },
		);
		console.log(deleted);
		res.status(200).send(deleted);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get controller collection
router.get("/get/controller", verifyHeadersJWT, async (req, res) => {
	try {
		const result = await controller.findOne({
			_id: new ObjectId("6415ced6b739c27e8fbfe54f"),
		});
		res.status(200).send(result);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? handle admin status & change website maintenance
router.put("/toggle/admin_maintenance", verifyHeadersJWT, async (req, res) => {
	try {
		const type = req.body.type;
		if (type.maintenance === false) {
			const isMaintenance = await controller.updateOne(
				{ maintenance: false },
				{ $set: { maintenance: true } },
			);
			return res.status(201).send({ maintenance: true });
		} else if (type.maintenance === true) {
			const isMaintenance = await controller.updateOne(
				{ maintenance: true },
				{ $set: { maintenance: false } },
			);
			return res.status(201).send({ maintenance: false });
		}
		if (type.activities === "online") {
			const isActive = await controller.updateOne(
				{ admin: "online" },
				{ $set: { admin: "offline" } },
			);
			return res.status(201).send({ admin: "offline" });
		} else if (type.activities === "offline") {
			const isActive = await controller.updateOne(
				{ admin: "offline" },
				{ $set: { admin: "online" } },
			);
			return res.status(201).send({ admin: "online" });
		}
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get all user accounts ui card show
router.get("/get/allUsers", verifyHeadersJWT, async (req, res) => {
	try {
		const users = await usersCollection
			.find({})
			.sort({ "createdAt.date": -1 })
			.toArray();
		res.status(201).send(users);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get users_history -> deposit history & withdraw history
router.get("/get/usersHistory", verifyHeadersJWT, async (req, res) => {
	try {
		const history = await historyCollection.find({}).toArray();
		// const getDep = await userDepositPending.find({}).toArray();
		// const getWith = await userWithdrawPending.find({}).toArray();
		// const history = [...getDep, ...getWith];
		res.status(200).send(history);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get admin_history -> deposit history & withdraw history
router.get("/get/AdminHistory", verifyHeadersJWT, async (req, res) => {
	try {
		const getDep = await deposit_admin_History.find({}).toArray();
		const getWith = await withdraw_admin_History.find({}).toArray();
		const history = [...getDep, ...getWith];
		res.status(200).send(history);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get verified user
router.get("/get/verified", verifyHeadersJWT, async (req, res) => {
	try {
		const getVerified = await usersCollection
			.find({ verified: true })
			.sort({ "createdAt.date": -1 })
			.toArray();
		res.status(201).send(getVerified);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? action withdraw confirm
router.put("/action/withdraw", verifyHeadersJWT, async (req, res) => {
	try {
		// const email = req.userEmail;
		const withdraw = req.body;
		const {
			_id,
			name,
			uid,
			balance,
			amount,
			number,
			operator,
			date,
			sent_number,
			createdAt,
			trxID,
			email,
			ss,
		} = withdraw;

		const userResult = await usersCollection.updateOne(
			{ email: email },
			{
				$push: {
					history: {
						case: "withdraw",
						amount: amount,
						balance: balance,
						createdAt: {
							date_fns: date,
							date: new Date(),
						},
					},
				},
			},
			{
				upsert: true,
			},
		);

		const userHistory = await userWithdrawPending.updateOne(
			{ _id: new ObjectId(_id) },
			{
				$set: {
					sent_number: sent_number,
					ss: ss,
					trxID: trxID,
					completedAt: {
						date_fns: date,
						date: new Date(),
					},
					status: "success",
				},
			},
			{ upsert: false },
		);

		const admin = await withdraw_admin_History.insertOne({
			name,
			orderID: _id,
			uid,
			case: "withdraw",
			number,
			sent_number,
			trxID,
			ss,
			amount,
			operator,
			email: email || "",
			status: "success",
			orderedDate: createdAt,
			completedAt: {
				date_fns: date,
				date: new Date(),
			},
		});
		res.status(201).send({ admin, userHistory, userResult });
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get pending withdraw
router.get("/pending/withdraw", verifyHeadersJWT, async (req, res) => {
	try {
		const pendingWithdraw = await userWithdrawPending
			.find({})
			.sort({ "createdAt.date": -1 })
			.toArray();
		res.status(201).send(pendingWithdraw);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? action deposit delete
router.delete("/delete/deposit/:id", verifyHeadersJWT, async (req, res) => {
	try {
		const id = req.params.id;
		const find = await userDepositPending.findOne({
			_id: new ObjectId(id),
		});
		const admin = await deposit_admin_History.insertOne({
			...find,
			status: "cancel",
			deletedAt: new Date(),
		});
		if (admin) {
			const deleted = await userDepositPending.deleteOne({
				_id: new ObjectId(id),
			});
			res.status(201).send(deleted);
		}
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? action deposit confirm
router.put("/action/deposit", verifyHeadersJWT, async (req, res) => {
	try {
		const userDeposits = req.body;
		const { _id, name, number, amount, trxID, operator, email, createdAt } =
			userDeposits;

		const date = format(new Date(), "P");
		const result = await usersCollection.updateOne(
			{ email: email },
			{ $inc: { "total.deposit": +amount, balance: +amount } },
			{ upsert: true },
		);
		const pendingDeposit = await userDepositPending.updateOne(
			{ _id: new ObjectId(_id) },
			{ $set: { status: "success" } },
			{ upsert: false },
		);
		const admin = await deposit_admin_History.insertOne({
			name,
			orderID: _id,
			case: userDeposits.case,
			number,
			amount,
			trxID,
			operator,
			email,
			status: "success",
			orderedDate: createdAt.date_fns,
			completedAt: {
				date_fns: date,
				date: new Date(),
			},
		});

		res.status(201).send({ result, pendingDeposit, admin });
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get pending deposit
router.get("/pending/deposit", verifyHeadersJWT, async (req, res) => {
	try {
		const pendingDeposit = await userDepositPending
			.find({})
			.sort({ "createdAt.date": -1 })
			.toArray();
		res.status(201).send(pendingDeposit);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

module.exports = router;
