const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { format } = require("date-fns");

const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

const user_database = client.db("users_dashboard");
const admin_database = client.db("admin_dashboard");
const auth_database = client.db("auth");

// ? admin collection
const depositRequestCollection = admin_database.collection("deposit_request");
const withdrawRequestCollection = admin_database.collection("withdraw_request");
const historyAdminCollection = admin_database.collection("history");
const earningAdminTable = admin_database.collection("earnings_table");
const totalBuyPackage = admin_database.collection("total_buy_package");
const controller = admin_database.collection("controllers");

// ? auth collection
const authCollection = auth_database.collection("auth");

// ? testing collection
const testCollection = user_database.collection("tests");

// ? users collection
const usersCollection = user_database.collection("users");
const historyCollection = user_database.collection("history");
const reviewCollection = user_database.collection("reviews");

const packageCollection = user_database.collection("package_history");
const userDepositCollection = user_database.collection("deposit_history");
const userWithdrawCollection = user_database.collection("withdraw_history");
// const packagesCollection = admin_database.collection("packages_request");
// const packagesCollection = admin_database.collection("packages_request");

const verifyJWT = async (req, res, next) => {
	const header = req.headers.authentication;
	if (!header) {
		return res.status(500).send({ message: "Invalid authorization header" });
	}
	const token = header.split(" ")[1];
	if (!token) {
		return res.status(403).send({ message: "unauthorized access token" });
	}
	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) {
			return res
				.status(201)
				.send({ access: false, message: "expired token clear data browser" });
		}
		req.userEmail = decoded.userEmail;
		next();
	});
};

const verifyForDataJWT = async (req, res, next) => {
	const authToken = req.body.token;
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
				.status(201)
				.send({ message: "expired token clear data browser" });
		}
		req.userEmail = decoded.userEmail;
		next();
	});
};

// router.put("/ads", async (req, res) => {

// 	try {
// 		const { _token } = req.body;
// 		// const addBalance = await usersCollection.updateOne(
// 		// 	{ token: _token },
// 		// 	{
// 		// 		$inc: { balance: +100 },
// 		// 		$inc: { earn: +100 },
// 		// 	},
// 		// );

// 		// statements: [
// 		// 	{
// 		// 		createdAt: new Date(),
// 		// 		ads_clicked: 5,
// 		// 	},
// 		// 	{
// 		// 		createdAt: new Date(),
// 		// 		ads_clicked: 3,
// 		// 	},
// 		// ];

// 		// {statements.createdAt:{'$lte':new Date(),'$gte':new Date(Date()-7)}}
// 		// const addBalance = await usersCollection.updateOne(
// 		// 	{ token: _token },
// 		// 	{
// 		// 		$set: {
// 		// 			"statements": [new Date()],
// 		// 		},
// 		// 	},
// 		// );

// 		// {statements.createdAt:{'$lte':new Date(),'$gte':new Date(Date()-7)}}

// 		// console.log(new Date().getDate());

// 		const a = await usersCollection.updateOne(
// 			{ token: _token },
// 			{
// 				$set: { "statements.$[element].click": 2 , "statements.$[element].createdAt": new Date()},
// 			},
// 			{
// 				arrayFilters: [
// 					{ "element.createdAt": { $gte: new Date() }, "element.ews": true },
// 				],
// 			},
// 			{ upsert: true },
// 		);
// 		console.log(a);

// 		res.send(a);

// 		// console.log(body, "body");
// 	} catch (error) {
// 		console.log(error);
// 	}
// });

router.put("/buy", async (req, res) => {
	try {
		const body = req.body;
		const reqAdmin = await packagesCollection.insertOne({
			package_name: body.pack,
			case: "package",
			email: body.email,
			status: "pending",
		});
		const buyPack = await usersCollection.updateOne(
			{ email: body.email },
			{
				$set: { "requested.package": "pending" },
				$inc: { balance: -500 },
				$push: {
					history: {
						createdAt: new Date(),
						package_name: body.pack,
						package_price: body.price,
						account: {
							balance: 200,
							deposit: 300,
							withdraw: 400,
						},
					},
				},
			},
			{ upsert: true },
		);
		res.send({ reqAdmin, buyPack });
	} catch (error) {
		console.log(error);
	}
});

// router.get('/verify-check', async (req, res) => {
// 	try {
// 		const verify_check = await usersCollection.findOne({
// 			$and: [
// 				{ email: req.query.email },
// 				{ account: "verified" }
// 			]
// 		})
// 		if (verify_check) {
// 			res.status(200).send({ access: true })
// 		} else {
// 			res.status(500).send({ access: false })
// 		}

// 	} catch (error) {
// 		res.status(500).send({ message: "server problem please try again verify check" });
// 	}
// })

router.get("/refer/:email", async (req, res) => {
	try {
		const email = req.params;
		const findUser = await usersCollection.findOne(email);
		const totalRefer = await usersCollection
			.find({ referID: findUser.UID })
			.toArray();
		res.status(201).send({ user: findUser, refer: totalRefer });
	} catch (error) {
		res.status(500).send({ message: "server problem by refer" });
	}
});

// router.put("/package-buy", async (req, res) => {
// 	try {
// 		const { email, pack, password } = req.query;
// 		let days = 0;
// 		let cost = 0;

// 		if (pack === "silver") {
// 			days = 20;
// 			cost = 300;
// 		} else if (pack === "gold") {
// 			days = 30;
// 			cost = 500;
// 		} else if (pack === "titan") {
// 			days = 50;
// 			cost = 1000;
// 		}
// 		const validUser = await usersCollection.findOne({
// 			$and: [{ email: email }, { password: password }],
// 		});

// 		if (validUser.balance < cost) {
// 			return res
// 				.status(500)
// 				.send({ message: "not enough money for this pack" });
// 		}
// 		if (validUser) {
// 			const buyingPack = await usersCollection.updateOne(
// 				{ email },
// 				{
// 					$set: { "package.pack": pack },
// 					$push: {
// 						history: {
// 							case: "buy package",
// 							package: pack,
// 							time: days,
// 							balance: validUser.balance,
// 							date: new Date(),
// 						},
// 					},
// 					$inc: { balance: -cost },
// 				},
// 				{ upsert: true },
// 			);
// 			const packInc = await usersCollection.updateOne(
// 				{ email },
// 				{
// 					$inc: { "package.remaining": +days },
// 				},
// 				{ upsert: true },
// 			);
// 			const data = {
// 				id: validUser._id.toString(),
// 				name: validUser.name,
// 				email: validUser.email,
// 				uid: validUser.uid,
// 				image: validUser.image,
// 				case: "package buy",
// 				package: pack,
// 				days,
// 				balance: {
// 					balance: validUser?.balance,
// 					deposit: validUser?.balance?.deposit,
// 					withdraw: validUser?.balance?.withdraw,
// 				},
// 				date: new Date(),
// 			};
// 			const history = await historyCollection.insertOne(data);
// 			res.status(201).send(buyingPack);
// 		} else {
// 			res.status(500).send({ message: "Password not valid" });
// 		}
// 	} catch (error) {
// 		res.status(500).send({ message: "server problem by buy package" });
// 	}
// });

router.get("/", async (req, res) => {
	try {
		const user = await usersCollection.findOne({ email: req.query.email });
		res.status(200).send({ user });
	} catch (error) {
		res.status(500).send({ message: "server problem by /" });
	}
});

router.post("/newUser", async (req, res) => {
	try {
		const find = await usersCollection.findOne({ uid: req.body.referID });
		const validateUser = await usersCollection.findOne({
			email: req.body.email,
		});
		if (find === null && validateUser === null) {
			const newUser = {
				...req.body,
				referID: "ARIF",
			};
			console.log(newUser);
			const newUsers = await usersCollection.insertOne(newUser);
			res.status(200).send(newUsers);
		} else if (find) {
			const result = await usersCollection.insertOne(req.body);
			res.status(200).send(result);
		}
	} catch (error) {
		res
			.status(500)
			.send({ message: "server problem please try again new user" });
	}
});


// * get mega user data from mongodb server
router.get("/get/megaData", verifyJWT, async (req, res) => {
	try {
		console.log('calling get')
		const email = req.userEmail;
		const findData = await usersCollection.findOne({ email: email });
		const myReview = await reviewCollection.find({ email: email }).toArray()
		// const waiting = await controller.findOne({
		// 	_id: new ObjectId("6415ced6b739c27e8fbfe54f"),
		// });

		// const email = req.userEmail;
		// const getUid = await usersCollection.findOne({ email: email });
		let uid = findData?.uid;
		let t = 0;
		let r = [];

		const data = await usersCollection.find({}).toArray();
		// console.log(data);
		let lv = data.filter(u => u.referID === uid);
		// console.log(lv, uid, "lv");
		// let lv1 = data.filter(u => u.referID === uid);
		let lv1 = [];

		const fetch = () => {
			if (lv.length > 0) {
				for (let i = 0; i < lv.length; i++) {
					const el = lv[i];

					const lv3 = data.filter(u => u.referID === el.uid);
					lv1 = [...lv1, ...lv3];
					// console.log(lv1, "lv1");

					t += lv3.length;
					r = [...r, ...lv1];
					// console.log(r, "r");
				}
				lv = lv1;
			}
			lv1 = [];
			if (lv.length > 0) {
				fetch();
			}
		};
		fetch();
		let f = data.filter(u => u.referID === uid);
		t += f.length;
		// console.log("Total Refer Is " + t);
		r = [...r, ...f];
		r = [...new Set(r)];
		// console.log({ r, t });

		// console.log('---------------end----------------')
		// how to get get unique array in js?
		// res.status(201).send({ referUser: r, totalRefer: t });

		// if (waiting?.maintenance) {
		// 	return res.status(200).send({ role: "waiting" });
		// }
		if (findData) {
			const direct = await usersCollection
				.find({ referID: findData?.uid })
				.toArray();


			res.status(200).send({
				findData, direct: direct.length, referUser: r, totalRefer: t, myReview
			});
		} else {
			res.status(500).send({ message: "User not found" });
		}
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
})

// ? post user reviews
router.post("/review", verifyJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		const review = req.body.review;
		const find = await usersCollection.findOne({ email: email });
		const postReview = await reviewCollection.insertOne({
			...review,
			email,
			profile: find?.image,
			name: find?.name,
			status: "pending",
		});
		res.status(201).send(postReview);
	} catch (error) {
		res.status(500).send(error.message);
	}
});

// ? get total refer users
router.get("/get/total_refer_users", verifyJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		const getUid = await usersCollection.findOne({ email: email });
		let uid = getUid?.uid;
		let t = 0;
		let r = [];

		const data = await usersCollection.find({}).toArray();
		// console.log(data);
		let lv = data.filter(u => u.referID === uid);
		// console.log(lv, uid, "lv");
		// let lv1 = data.filter(u => u.referID === uid);
		let lv1 = [];

		const fetch = () => {
			if (lv.length > 0) {
				for (let i = 0; i < lv.length; i++) {
					const el = lv[i];

					const lv3 = data.filter(u => u.referID === el.uid);
					lv1 = [...lv1, ...lv3];
					// console.log(lv1, "lv1");

					t += lv3.length;
					r = [...r, ...lv1];
					// console.log(r, "r");
				}
				lv = lv1;
			}
			lv1 = [];
			if (lv.length > 0) {
				fetch();
			}
		};
		fetch();
		let f = data.filter(u => u.referID === uid);
		t += f.length;
		// console.log("Total Refer Is " + t);
		r = [...r, ...f];
		r = [...new Set(r)];
		// console.log({ r, t });

		// console.log('---------------end----------------')
		// how to get get unique array in js?
		res.status(201).send({ referUser: r, totalRefer: t });
	} catch (error) {
		res.status(500).send(error.message);
	}
});

// ? success deposit and withdraw for client or guest
router.get("/deposit_withdraw", async (req, res) => {
	try {
		const deposit = await userDepositCollection
			.find({ status: "success" })
			.sort({ "createdAt.date": -1 })
			.limit(10)
			.toArray();
		const withdraw = await userWithdrawCollection
			.find({ status: "success" })
			.sort({ "createdAt.date": -1 })
			.limit(10)
			.toArray();

		res.status(200).send({ deposit, withdraw });
	} catch (error) {
		res.status(500).send(error.message);
	}
});

// ? package buy user
router.put("/package_buy", verifyJWT, async (req, res) => {
	try {
		const { email, pack, password } = req.query;
		const date = format(new Date(), "P");
		let days = 0;
		let cost = 0;

		if (pack === "basic") {
			days = 20;
			cost = 300;
		} else if (pack === "standard") {
			days = 30;
			cost = 500;
		} else {
			days = 0;
			cost = 1000;
		}

		const auth = await authCollection.findOne({ email: email });
		const user = await usersCollection.findOne({ email: email });
		if (auth) {
			const pass = await bcrypt.compare(password, auth.password);
			if (pass) {
				if (user?.balance >= cost) {
					const buyingPack = await usersCollection.updateOne(
						{ email: email },
						{
							$set: { "package.pack": pack },
							$push: {
								history: {
									case: `Pack Purchase | ${pack}`,
									amount: cost,
									balance: user.balance,
									createdAt: {
										date_fns: date,
										date: new Date(),
									},
								},
							},
							$inc: { balance: -cost, "package.remaining": +days },
						},
						{ upsert: true },
					);

					const historyData = {
						name: user.name,
						email: user.email,
						uid: user.uid,
						image: user?.image,
						case: pack,
						amount: cost,
						balance: user?.balance,
						total: {
							withdraw: user?.total?.withdraw || 0,
							deposit: user?.total?.deposit || 0,
							earned: user?.total?.earned || 0,
							referIncome: user?.total?.referIncome || 0,
						},
						date: {
							date_fns: date,
							date: new Date(),
						},
					};
					const history = await historyCollection.insertOne(historyData);
					const packHistory = await packageCollection.insertOne({ ...historyData, phone: user?.information?.phone, package: user?.package?.remaining })
					res.status(201).send(buyingPack);
				} else {
					res.status(500).send({ message: "please deposit money" });
				}
			} else {
				res
					.status(500)
					.send({ message: "password mismatch please enter valid password" });
			}
		}
	} catch (error) {
		res.status(500).send({ message: "server problem by buy package" });
	}
});

// ? handle profile update
router.put("/update/profile", verifyJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		const newData = req.body;
		const newInfo = {
			address: newData.address,
			city: newData.city,
			zip: newData.zip,
			age: newData.age,
			phone: newData.phone,
		};
		console.log(newData);

		const user = await usersCollection.updateOne(
			{ email: email },
			{
				$set: {
					image: newData.image,
					name: newData.name.replace(/\s+/g, " ").trim(),
					information: newInfo,
				},
			},
		);
		res.status(200).send(user);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get controllers
router.get("/get/controller", verifyJWT, async (req, res) => {
	try {
		const result = await controller.findOne({
			_id: new ObjectId("6415ced6b739c27e8fbfe54f"),
		});
		res.status(200).send(result);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? ads showing single leaf count
router.put("/ads/earnings-leaf", verifyJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		const ads = req.body.adsLink;
		const split1 = ads.split("//");
		const split2 = split1[1].split("/");
		const link =
			split1[0] + "//" + split2[0] + "/" + split2[1] + "/" + "index.html";
		const date = format(new Date(), "P");
		console.log({ ads, split1, split2, link });

		const findUser = await usersCollection.findOne({
			$and: [
				{
					email: email,
				},
				{ earningsTable: { $elemMatch: { date: date } } },
			],
		});
		const user = await usersCollection.findOne({ email: email });
		if (findUser === null) {
			if (user?.package?.remaining) {
				console.log("remaining");
				const newClicked = await usersCollection.updateOne(
					{ email: email },
					{
						$push: {
							earningsTable: {
								date: date,
								clicked: 1,
								watched: [link],
							},
						},
						$inc: { balance: +1, "total.earned": +1, "package.remaining": -1 },
					},
				);
				console.log(newClicked);
			} else {
				return res
					.status(500)
					.send({ message: "please buy package your package has expired" });
			}

			// ? admin earnings table start point
			const at = await earningAdminTable.findOne({ "date.date_fns": date });
			if (at === null) {
				const newClicked = await earningAdminTable.insertOne({
					date: { date_fns: date, date: new Date() },
					clicked: 1,
				});

				return res.send({
					newClicked,
					message: "new clicked admin ",
				});
			} else {
				const exitsClicked = await earningAdminTable.updateOne(
					{ "date.date_fns": date },
					{
						$inc: {
							clicked: +1,
						},
					},
				);
				return res
					.status(201)
					.send({ newClicked, exitsClicked, message: "exitsClicked admin" });
			}
			// ? admin earnings table end point

			// return res.send({ newClicked, message: "new clicked " });
		} else {
			const todayDate = findUser.earningsTable.find(e => e.date === date);
			const todayLinkExits = todayDate.watched.find(f => f === link);
			if (todayLinkExits === undefined) {
				const updateExitsDay = await usersCollection.updateOne(
					{
						email: email,
						"earningsTable.date": date,
					},
					{
						$inc: {
							"earningsTable.$.clicked": +1,
							balance: +1,
							"total.earned": +1,
						},
						$push: { "earningsTable.$.watched": link },
					},
				);

				// ? admin earnings table start point
				const at = await earningAdminTable.findOne({ "date.date_fns": date });
				if (at === null) {
					const newClicked = await earningAdminTable.insertOne({
						date: { date_fns: date, date: new Date() },
						clicked: 1,
					});

					return res.status(201).send({
						updateExitsDay,
						newClicked,
						message: "new clicked admin ",
					});
				} else {
					const exitsClicked = await earningAdminTable.updateOne(
						{ "date.date_fns": date },
						{
							$inc: {
								clicked: +1,
							},
						},
					);
					return res.status(201).send({
						updateExitsDay,
						exitsClicked,
						message: "exitsClicked admin",
					});
				}
				// ? admin earnings table end point

				// return res
				// 	.status(201)
				// 	.send({ updateExitsDay, message: "updateExitsDay" });
			} else {
				console.log({ message: "sorry watched this link" });
				return res.status(501).send({ message: "sorry watched this link" });
			}
		}
	} catch (error) {
		res.status(500).send({ message: "something wrong please try again" });
	}
});

// ? account verify by user
router.put("/verify", verifyJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		let referID = 0;
		let amount = 180;
		let percentage = 2.3;
		const date = format(new Date(), "P");
		const check = await usersCollection.findOne({ email: email });
		if (check.balance >= 1000) {
			const userResult = await usersCollection.updateOne(
				{ email: email },
				{
					$push: {
						history: {
							case: "verify",
							amount: 1000,
							balance: check?.balance,
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

			const accountOwner = await usersCollection.updateOne(
				{ email: email },
				{
					$set: {
						verified: true,
						"package.pack": "basic",
						"package.remaining": 20,
					},
					$inc: { balance: -1000 },
				},
				{ upsert: true },
			);
			const referrerUser = await usersCollection.findOne({ email: email });
			referID = referrerUser.referID;

			for (let i = 0; i < 10; i++) {
				const referrerUser = await usersCollection.findOne({ uid: referID });
				if (referrerUser) {
					const accountOwner = await usersCollection.updateOne(
						{ uid: referID },
						{
							$inc: {
								balance: +amount.toFixed(2),
								"total.referIncome": +amount,
							},
						},
						{ upsert: true },
					);
					referID = referrerUser.referID;
					amount = amount / percentage;
					console.log(amount);
				}
			}
			const find = await usersCollection.find({}).toArray();
			res.status(200).send({ accountOwner });
		} else {
			res.status(501).send({
				message: "you do not have enough money to verify your account",
			});
		}
	} catch (error) {
		console.log(error);
	}
});

// ? get direct Refer
router.get("/get/directRefer", verifyJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		const user = await usersCollection.findOne({ email: email });
		const findData = await usersCollection
			.find({ referID: user?.uid })
			.toArray();

		res.status(200).send(findData);
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? withdraw request
router.post("/withdraw", verifyForDataJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		const data = req.body.withdraw;
		const { name, uid, amount, number, password, operator, date, balance } =
			data;
		const auth = await authCollection.findOne({ email: email });
		const user = await usersCollection.findOne({ email: email });
		if (auth) {
			const pass = await bcrypt.compare(password, auth.password);
			if (pass) {
				const userResult = await usersCollection.updateOne(
					{ email: email },
					{ $inc: { "total.withdraw": +amount, balance: -amount } },
					{ upsert: true },
				);

				// ? save user history start
				const historyData = {
					name,
					email,
					uid,
					image: user?.image,
					case: "withdraw",
					amount: amount,
					balance: user?.balance,
					total: {
						withdraw: user?.total?.withdraw,
						deposit: user?.total?.deposit,
						earned: user?.total?.earned,
						referIncome: user?.total?.referIncome,
					},
					date: {
						date_fns: date,
						date: new Date(),
					},
				};
				const history = await historyCollection.insertOne(historyData);
				// ? save user history end

				const userHistory = await userWithdrawCollection.insertOne({
					name,
					uid,
					case: "withdraw",
					number,
					operator,
					balance,
					amount,
					createdAt: {
						date_fns: date,
						date: new Date(),
					},
					email,
					status: "pending",
				});

				res.status(201).send({
					userResult,
					success: true,
					message: "successfully withdraw request sent",
				});
			} else {
				res.status(500).send({ message: "unauthorized password not match" });
			}
		} else {
			res.status(500).send({ access: false });
		}
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? deposit request
router.post("/deposit", verifyForDataJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		const data = req.body.deposit;
		const {
			name,
			uid,
			amount,
			number,
			trxID,
			password,
			operator,
			date,
			balance,
			ss,
		} = data;
		const auth = await authCollection.findOne({ email: email });
		const user = await usersCollection.findOne({ email: email });
		if (auth) {
			const pass = await bcrypt.compare(password, auth.password);
			if (pass) {
				const userResult = await usersCollection.updateOne(
					{ email: email },
					{
						$push: {
							history: {
								case: "deposit",
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

				// ? save user history start
				const historyData = {
					name,
					email,
					uid,
					image: user?.image,
					case: "deposit",
					amount: amount,
					balance: user?.balance,
					total: {
						withdraw: user?.total?.withdraw,
						deposit: user?.total?.deposit,
						earned: user?.total?.earned,
						referIncome: user?.total?.referIncome,
					},
					date: {
						date_fns: date,
						date: new Date(),
					},
				};
				const history = await historyCollection.insertOne(historyData);
				// ? save user history end

				const userHistory = await userDepositCollection.insertOne({
					name,
					uid,
					case: "deposit",
					number,
					balance,
					amount,
					trxID,
					operator,
					createdAt: {
						date_fns: date,
						date: new Date(),
					},
					email,
					status: "pending",
					ss,
				});

				res.status(201).send({
					success: true,
					message: "successfully deposit request sent",
				});
			} else {
				res.status(500).send({ message: "unauthorized password not match" });
			}
		} else {
			res.status(500).send({ access: false });
		}
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

// ? get user Data to ui
router.get("/getData", verifyJWT, async (req, res) => {
	try {
		const email = req.userEmail;
		const findData = await usersCollection.findOne({ email: email });
		if (findData) {
			res.status(200).send(findData);
		} else {
			res.status(500).send({ message: "User not found" });
		}
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
});

module.exports = router;
