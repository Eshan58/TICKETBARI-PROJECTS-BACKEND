// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const admin = require("firebase-admin");
// const bodyParser = require("body-parser");
// const fs = require("fs");
// const path = require("path");
// const jwt = require("jsonwebtoken");

// const app = express();

// // CORS setup
// app.use(
//   cors({
//     origin: ["http://localhost:3000", "http://localhost:5173"],
//     credentials: true,
//   })
// );

// app.use(bodyParser.json());

// // Request logging
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
//   next();
// });

// // MongoDB Connection
// mongoose.set("strictQuery", false);
// const MONGO_URI = process.env.MONGO_URI;

// mongoose
//   .connect(MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("✅ MongoDB Connected Successfully");
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection failed:", err.message);
//   });

// // Firebase Admin
// let firebaseApp;
// try {
//   const serviceAccountPath = path.join(
//     __dirname,
//     "ticketbari-projects-firebase-adminsdk-fbsvc-1d8b29239b.json"
//   );

//   if (!fs.existsSync(serviceAccountPath)) {
//     throw new Error("Firebase service account file not found!");
//   }

//   const serviceAccount = require(serviceAccountPath);
//   firebaseApp = admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
//   console.log("✅ Firebase Admin initialized");
// } catch (error) {
//   console.error("❌ Firebase Admin Error:", error.message);
//   console.log("Running without Firebase (JWT only mode)");
//   firebaseApp = null;
// }

// // Mongoose Schemas
// const { Schema } = mongoose;

// const userSchema = new Schema(
//   {
//     uid: { type: String, required: true, unique: true, index: true },
//     name: String,
//     email: { type: String, required: true, lowercase: true, trim: true },
//     photoURL: String,
//     role: {
//       type: String,
//       enum: ["user", "vendor", "admin"],
//       default: "user",
//       index: true,
//     },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
//   },
//   {
//     timestamps: true,
//   }
// );

// const ticketSchema = new Schema(
//   {
//     title: { type: String, required: true, trim: true },
//     from: { type: String, required: true, trim: true },
//     to: { type: String, required: true, trim: true },
//     transportType: {
//       type: String,
//       enum: ["bus", "train", "launch", "plane"],
//       required: true,
//       index: true,
//     },
//     price: { type: Number, required: true, min: 0 },
//     quantity: { type: Number, required: true, min: 0 },
//     availableQuantity: {
//       type: Number,
//       default: function () {
//         return this.quantity;
//       },
//     },
//     perks: [String],
//     image: {
//       type: String,
//       default:
//         "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop",
//     },
//     departureAt: { type: Date, required: true, index: true },
//     arrivalAt: Date,
//     vendorId: { type: String, required: true, index: true },
//     vendorName: String,
//     verified: {
//       type: String,
//       enum: ["pending", "approved", "rejected"],
//       default: "pending",
//       index: true,
//     },
//     advertised: { type: Boolean, default: false, index: true },
//     description: String,
//     isActive: { type: Boolean, default: true },
//   },
//   {
//     timestamps: true,
//   }
// );

// const bookingSchema = new Schema(
//   {
//     userId: { type: String, required: true, index: true },
//     userName: String,
//     userEmail: String,
//     ticketId: {
//       type: Schema.Types.ObjectId,
//       ref: "Ticket",
//       required: true,
//       index: true,
//     },
//     ticketTitle: String,
//     quantity: { type: Number, required: true, min: 1 },
//     totalPrice: { type: Number, required: true, min: 0 },
//     status: {
//       type: String,
//       enum: ["pending", "confirmed", "cancelled", "completed"],
//       default: "pending",
//       index: true,
//     },
//     bookingDate: { type: Date, default: Date.now },
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "paid", "refunded"],
//       default: "pending",
//       index: true,
//     },
//     bookingReference: { type: String, unique: true },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Vendor Application Schema
// const vendorApplicationSchema = new Schema(
//   {
//     userId: { type: String, required: true, index: true },
//     userName: { type: String, required: true },
//     userEmail: { type: String, required: true },
//     businessName: { type: String, required: true },
//     contactName: { type: String, required: true },
//     phone: { type: String, required: true },
//     businessType: { type: String, required: true },
//     description: { type: String, required: true },
//     website: { type: String },
//     address: { type: String, required: true },
//     taxId: { type: String },
//     status: {
//       type: String,
//       enum: ["pending", "approved", "rejected"],
//       default: "pending",
//       index: true,
//     },
//     submittedAt: { type: Date, default: Date.now },
//     reviewedAt: Date,
//     reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
//     reviewNotes: String,
//   },
//   {
//     timestamps: true,
//   }
// );

// bookingSchema.pre("save", function (next) {
//   if (!this.bookingReference) {
//     this.bookingReference =
//       "TB-" +
//       Date.now() +
//       "-" +
//       Math.random().toString(36).substr(2, 9).toUpperCase();
//   }
//   next();
// });

// const User = mongoose.model("User", userSchema);
// const Ticket = mongoose.model("Ticket", ticketSchema);
// const Booking = mongoose.model("Booking", bookingSchema);
// const VendorApplication = mongoose.model("VendorApplication", vendorApplicationSchema);

// // Validation Helper
// const validateRequest = (req, res, next) => {
//   const errors = [];

//   if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
//     errors.push("Invalid email format");
//   }

//   if (req.body.price && req.body.price < 0) {
//     errors.push("Price cannot be negative");
//   }

//   if (errors.length > 0) {
//     return res.status(400).json({
//       success: false,
//       message: "Validation failed",
//       errors,
//     });
//   }

//   next();
// };

// // Auth Middleware
// async function universalAuthMiddleware(req, res, next) {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({
//       success: false,
//       message: "No token provided. Please login first.",
//     });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     if (firebaseApp) {
//       const decoded = await admin.auth().verifyIdToken(token);
//       req.user = decoded;
//       req.authType = "firebase";

//       const mongoUser = await User.findOneAndUpdate(
//         { uid: decoded.uid },
//         {
//           uid: decoded.uid,
//           name: decoded.name || decoded.email?.split("@")[0] || "User",
//           email: decoded.email,
//           photoURL: decoded.picture || "",
//           updatedAt: new Date(),
//         },
//         {
//           upsert: true,
//           new: true,
//           setDefaultsOnInsert: true,
//         }
//       );

//       req.mongoUser = mongoUser;
//     } else {
//       const decoded = jwt.verify(
//         token,
//         process.env.JWT_SECRET || "your-secret-key-change-in-production"
//       );
//       const user = await User.findById(decoded.id);
//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           message: "User not found. Please login again.",
//         });
//       }
//       req.mongoUser = user;
//       req.user = user;
//       req.authType = "jwt";
//     }

//     next();
//   } catch (err) {
//     console.error("🔴 Auth Error:", err.message);

//     if (err.name === "TokenExpiredError") {
//       return res.status(401).json({
//         success: false,
//         message: "Token expired. Please login again.",
//       });
//     }

//     res.status(401).json({
//       success: false,
//       message: "Authentication failed. Please login again.",
//     });
//   }
// }

// // Role Middleware
// const requireRole = (roles) => {
//   return (req, res, next) => {
//     if (!req.mongoUser) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required",
//       });
//     }

//     if (!roles.includes(req.mongoUser.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `Access denied. Required roles: ${roles.join(", ")}`,
//       });
//     }

//     next();
//   };
// };

// // Error Handler
// const errorHandler = (err, req, res, next) => {
//   console.error("🔥 Server Error:", err.message);

//   if (err.code === 11000) {
//     return res.status(409).json({
//       success: false,
//       message: "Duplicate entry found",
//       field: Object.keys(err.keyPattern)[0],
//     });
//   }

//   if (err.name === "ValidationError") {
//     const errors = Object.values(err.errors).map((e) => e.message);
//     return res.status(400).json({
//       success: false,
//       message: "Validation Error",
//       errors,
//     });
//   }

//   if (err.name === "JsonWebTokenError") {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid token",
//     });
//   }

//   res.status(500).json({
//     success: false,
//     message: "Internal server error",
//   });
// };

// // Public Routes
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "🎫 TicketBari API is running smoothly!",
//     version: "1.0.0",
//   });
// });

// app.get("/api/health", async (req, res) => {
//   const health = {
//     status: "healthy",
//     timestamp: new Date().toISOString(),
//     database:
//       mongoose.connection.readyState === 1 ? "connected" : "disconnected",
//     firebase: firebaseApp ? "connected" : "not configured",
//   };

//   res.json({ success: true, data: health });
// });

// // Advertised Tickets
// app.get("/api/advertised", async (req, res, next) => {
//   try {
//     const tickets = await Ticket.find({
//       advertised: true,
//       verified: "approved",
//       isActive: true,
//       departureAt: { $gte: new Date() },
//     })
//       .sort({ departureAt: 1 })
//       .limit(12);

//     res.json({
//       success: true,
//       data: { tickets },
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // All Tickets
// app.get("/api/tickets", async (req, res, next) => {
//   try {
//     const {
//       page = 1,
//       limit = 8,
//       transport = "",
//       sort = "",
//       from,
//       to,
//       minPrice,
//       maxPrice,
//       date,
//     } = req.query;

//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);
//     const skip = (pageNum - 1) * limitNum;

//     let filter = {
//       verified: "approved",
//       isActive: true,
//     };

//     if (transport && transport !== "") {
//       filter.transportType = transport;
//     }

//     if (from && from !== "") {
//       filter.from = new RegExp(from, "i");
//     }

//     if (to && to !== "") {
//       filter.to = new RegExp(to, "i");
//     }

//     if (minPrice || maxPrice) {
//       filter.price = {};
//       if (minPrice) filter.price.$gte = Number(minPrice);
//       if (maxPrice) filter.price.$lte = Number(maxPrice);
//     }

//     if (date && date !== "") {
//       const startDate = new Date(date);
//       startDate.setHours(0, 0, 0, 0);
//       const endDate = new Date(date);
//       endDate.setHours(23, 59, 59, 999);
//       filter.departureAt = { $gte: startDate, $lte: endDate };
//     }

//     let sortOption = { createdAt: -1 };
//     if (sort === "price_asc") sortOption = { price: 1 };
//     else if (sort === "price_desc") sortOption = { price: -1 };

//     const [tickets, total] = await Promise.all([
//       Ticket.find(filter).sort(sortOption).skip(skip).limit(limitNum),
//       Ticket.countDocuments(filter),
//     ]);

//     res.json({
//       success: true,
//       data: {
//         tickets,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total,
//           pages: Math.ceil(total / limitNum) || 0,
//           hasNext: pageNum * limitNum < total,
//           hasPrev: pageNum > 1,
//         },
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Single Ticket
// app.get("/api/tickets/:id", async (req, res, next) => {
//   try {
//     const ticket = await Ticket.findById(req.params.id);
//     if (!ticket) {
//       return res.status(404).json({
//         success: false,
//         message: "Ticket not found",
//       });
//     }
//     res.json({ success: true, data: { ticket } });
//   } catch (error) {
//     next(error);
//   }
// });

// // User Routes
// app.get(
//   "/api/user/profile",
//   universalAuthMiddleware,
//   async (req, res, next) => {
//     try {
//       const user = req.mongoUser;
//       res.json({ success: true, data: { user } });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.put(
//   "/api/user/profile",
//   universalAuthMiddleware,
//   validateRequest,
//   async (req, res, next) => {
//     try {
//       const { name, photoURL } = req.body;
//       const userId = req.mongoUser._id;

//       const updateData = {};
//       if (name) updateData.name = name;
//       if (photoURL) updateData.photoURL = photoURL;

//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         { $set: updateData },
//         { new: true, runValidators: true }
//       );

//       res.json({
//         success: true,
//         message: "Profile updated successfully",
//         data: { user: updatedUser },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.get(
//   "/api/user/dashboard",
//   universalAuthMiddleware,
//   async (req, res, next) => {
//     try {
//       const userId = req.mongoUser.uid || req.mongoUser._id;
//       const [allBookings, pendingBookings, confirmedBookings, recentBookings] =
//         await Promise.all([
//           Booking.find({ userId }),
//           Booking.find({ userId, status: "pending" }),
//           Booking.find({ userId, status: "confirmed" }),
//           Booking.find({ userId })
//             .populate(
//               "ticketId",
//               "title from to departureAt transportType image price"
//             )
//             .sort({ createdAt: -1 })
//             .limit(5),
//         ]);

//       const stats = {
//         totalBooked: allBookings.length,
//         pending: pendingBookings.length,
//         confirmed: confirmedBookings.length,
//         totalSpent: allBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
//       };

//       res.json({
//         success: true,
//         data: { stats, recentBookings, user: req.mongoUser },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // User Bookings
// app.get(
//   "/api/my-bookings",
//   universalAuthMiddleware,
//   async (req, res, next) => {
//     try {
//       const userId = req.mongoUser.uid || req.mongoUser._id;
//       const bookings = await Booking.find({ userId })
//         .populate("ticketId", "title from to departureAt transportType image")
//         .sort({ createdAt: -1 });

//       res.json({ success: true, data: { bookings } });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Create Booking
// app.post(
//   "/api/bookings",
//   universalAuthMiddleware,
//   validateRequest,
//   async (req, res, next) => {
//     try {
//       const { ticketId, quantity } = req.body;

//       if (!ticketId || !quantity || quantity < 1) {
//         return res.status(400).json({
//           success: false,
//           message: "Ticket ID and quantity (minimum 1) are required",
//         });
//       }

//       const ticket = await Ticket.findById(ticketId);
//       if (!ticket) {
//         return res.status(404).json({
//           success: false,
//           message: "Ticket not found",
//         });
//       }

//       if (ticket.availableQuantity < quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Only ${ticket.availableQuantity} tickets available`,
//         });
//       }

//       const booking = await Booking.create({
//         userId: req.mongoUser.uid || req.mongoUser._id,
//         userName: req.mongoUser.name || req.mongoUser.email.split("@")[0],
//         userEmail: req.mongoUser.email,
//         ticketId,
//         ticketTitle: ticket.title,
//         quantity,
//         totalPrice: ticket.price * quantity,
//         status: "pending",
//       });

//       ticket.availableQuantity -= quantity;
//       await ticket.save();

//       res.status(201).json({
//         success: true,
//         message: "Booking created successfully",
//         data: { booking },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Vendor Application Routes
// app.post(
//   "/api/apply-vendor",
//   universalAuthMiddleware,
//   validateRequest,
//   async (req, res, next) => {
//     try {
//       const {
//         businessName,
//         contactName,
//         phone,
//         businessType,
//         description,
//         website,
//         address,
//         taxId,
//       } = req.body;

//       const requiredFields = [
//         "businessName",
//         "contactName",
//         "phone",
//         "businessType",
//         "description",
//         "address",
//       ];
//       const missingFields = requiredFields.filter((field) => !req.body[field]);

//       if (missingFields.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: `Missing required fields: ${missingFields.join(", ")}`,
//         });
//       }

//       if (req.mongoUser.role === "vendor") {
//         return res.status(400).json({
//           success: false,
//           message: "You are already a vendor",
//         });
//       }

//       const existingApplication = await VendorApplication.findOne({
//         userId: req.mongoUser.uid || req.mongoUser._id,
//         status: "pending",
//       });

//       if (existingApplication) {
//         return res.status(400).json({
//           success: false,
//           message: "You already have a pending vendor application",
//         });
//       }

//       const application = await VendorApplication.create({
//         userId: req.mongoUser.uid || req.mongoUser._id,
//         userName: req.mongoUser.name || req.mongoUser.email.split("@")[0],
//         userEmail: req.mongoUser.email,
//         businessName,
//         contactName,
//         phone,
//         businessType,
//         description,
//         website,
//         address,
//         taxId,
//         status: "pending",
//       });

//       res.status(201).json({
//         success: true,
//         message: "Vendor application submitted successfully!",
//         data: { application },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.get(
//   "/api/my-vendor-application",
//   universalAuthMiddleware,
//   async (req, res, next) => {
//     try {
//       const application = await VendorApplication.findOne({
//         userId: req.mongoUser.uid || req.mongoUser._id,
//       }).sort({ createdAt: -1 });

//       res.json({ success: true, data: { application } });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Vendor Routes
// app.get(
//   "/api/vendor/tickets",
//   universalAuthMiddleware,
//   requireRole(["vendor"]),
//   async (req, res, next) => {
//     try {
//       const vendorId = req.mongoUser.uid || req.mongoUser._id;
//       const tickets = await Ticket.find({ vendorId }).sort({ createdAt: -1 });
//       res.json({ success: true, data: { tickets } });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.post(
//   "/api/vendor/tickets",
//   universalAuthMiddleware,
//   requireRole(["vendor"]),
//   validateRequest,
//   async (req, res, next) => {
//     try {
//       const { title, from, to, transportType, price, quantity, departureAt } =
//         req.body;

//       const requiredFields = [
//         "title",
//         "from",
//         "to",
//         "transportType",
//         "price",
//         "quantity",
//         "departureAt",
//       ];
//       const missingFields = requiredFields.filter((field) => !req.body[field]);

//       if (missingFields.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: `Missing required fields: ${missingFields.join(", ")}`,
//         });
//       }

//       const newTicket = await Ticket.create({
//         ...req.body,
//         vendorId: req.mongoUser.uid || req.mongoUser._id,
//         vendorName: req.mongoUser.name || req.mongoUser.email,
//         availableQuantity: req.body.quantity,
//         verified: "pending",
//         isActive: true,
//       });

//       res.status(201).json({
//         success: true,
//         message: "Ticket submitted for admin approval",
//         data: { ticket: newTicket },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Admin Routes
// app.get(
//   "/api/admin/dashboard",
//   universalAuthMiddleware,
//   requireRole(["admin"]),
//   async (req, res, next) => {
//     try {
//       const [
//         totalUsers,
//         totalTickets,
//         totalBookings,
//         pendingTickets,
//         pendingVendorApplications,
//         totalVendors,
//       ] = await Promise.all([
//         User.countDocuments(),
//         Ticket.countDocuments(),
//         Booking.countDocuments(),
//         Ticket.countDocuments({ verified: "pending" }),
//         VendorApplication.countDocuments({ status: "pending" }),
//         User.countDocuments({ role: "vendor" }),
//       ]);

//       res.json({
//         success: true,
//         data: {
//           users: totalUsers,
//           tickets: totalTickets,
//           bookings: totalBookings,
//           pendingApprovals: pendingTickets,
//           pendingVendorApplications,
//           vendors: totalVendors,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Admin Vendor Applications
// app.get(
//   "/api/admin/vendor-applications",
//   universalAuthMiddleware,
//   requireRole(["admin"]),
//   async (req, res, next) => {
//     try {
//       const { status, page = 1, limit = 10 } = req.query;
//       const pageNum = parseInt(page);
//       const limitNum = parseInt(limit);
//       const skip = (pageNum - 1) * limitNum;

//       let filter = {};
//       if (status) filter.status = status;

//       const [applications, total] = await Promise.all([
//         VendorApplication.find(filter)
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(limitNum)
//           .populate("reviewedBy", "name email"),
//         VendorApplication.countDocuments(filter),
//       ]);

//       const statusCounts = await VendorApplication.aggregate([
//         { $group: { _id: "$status", count: { $sum: 1 } } },
//       ]);

//       res.json({
//         success: true,
//         data: {
//           applications,
//           pagination: {
//             page: pageNum,
//             limit: limitNum,
//             total,
//             pages: Math.ceil(total / limitNum),
//           },
//           stats: {
//             total,
//             pending: statusCounts.find((s) => s._id === "pending")?.count || 0,
//             approved: statusCounts.find((s) => s._id === "approved")?.count || 0,
//             rejected: statusCounts.find((s) => s._id === "rejected")?.count || 0,
//           },
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.get(
//   "/api/admin/vendor-applications/:id",
//   universalAuthMiddleware,
//   requireRole(["admin"]),
//   async (req, res, next) => {
//     try {
//       const application = await VendorApplication.findById(req.params.id)
//         .populate("reviewedBy", "name email");

//       if (!application) {
//         return res.status(404).json({
//           success: false,
//           message: "Vendor application not found",
//         });
//       }

//       res.json({ success: true, data: { application } });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.put(
//   "/api/admin/vendor-applications/:id/review",
//   universalAuthMiddleware,
//   requireRole(["admin"]),
//   async (req, res, next) => {
//     try {
//       const { status, reviewNotes } = req.body;

//       if (!["approved", "rejected"].includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid status. Must be 'approved' or 'rejected'",
//         });
//       }

//       const application = await VendorApplication.findById(req.params.id);
//       if (!application) {
//         return res.status(404).json({
//           success: false,
//           message: "Vendor application not found",
//         });
//       }

//       if (application.status !== "pending") {
//         return res.status(400).json({
//           success: false,
//           message: "Application has already been reviewed",
//         });
//       }

//       application.status = status;
//       application.reviewedAt = new Date();
//       application.reviewedBy = req.mongoUser._id;
//       application.reviewNotes = reviewNotes;
//       await application.save();

//       if (status === "approved") {
//         await User.findOneAndUpdate(
//           { uid: application.userId },
//           { $set: { role: "vendor" } }
//         );
//       }

//       res.json({
//         success: true,
//         message: `Vendor application ${status} successfully`,
//         data: { application },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Admin Tickets Management
// app.get(
//   "/api/admin/tickets",
//   universalAuthMiddleware,
//   requireRole(["admin"]),
//   async (req, res, next) => {
//     try {
//       const { page = 1, limit = 10, verified } = req.query;
//       const pageNum = parseInt(page);
//       const limitNum = parseInt(limit);
//       const skip = (pageNum - 1) * limitNum;

//       let filter = {};
//       if (verified) filter.verified = verified;

//       const [tickets, total] = await Promise.all([
//         Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
//         Ticket.countDocuments(filter),
//       ]);

//       res.json({
//         success: true,
//         data: {
//           tickets,
//           pagination: {
//             page: pageNum,
//             limit: limitNum,
//             total,
//             pages: Math.ceil(total / limitNum),
//           },
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.put(
//   "/api/admin/tickets/:id/verify",
//   universalAuthMiddleware,
//   requireRole(["admin"]),
//   async (req, res, next) => {
//     try {
//       const { status } = req.body;

//       if (!["approved", "rejected"].includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid status. Must be 'approved' or 'rejected'",
//         });
//       }

//       const ticket = await Ticket.findById(req.params.id);
//       if (!ticket) {
//         return res.status(404).json({
//           success: false,
//           message: "Ticket not found",
//         });
//       }

//       ticket.verified = status;
//       ticket.isActive = status === "approved";
//       await ticket.save();

//       res.json({
//         success: true,
//         message: `Ticket ${status} successfully`,
//         data: { ticket },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Apply Error Handler
// app.use(errorHandler);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.method} ${req.url}`,
//   });
// });

// // Start Server
// const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log("==========================================");
//   console.log("🎫 ADMIN VENDOR APPLICATION SYSTEM ENABLED:");
//   console.log("1. GET /api/admin/vendor-applications - View all applications");
//   console.log("2. PUT /api/admin/vendor-applications/:id/review - Review application");
//   console.log("3. GET /api/admin/tickets - Manage tickets");
//   console.log("4. PUT /api/admin/tickets/:id/verify - Verify tickets");
//   console.log("==========================================");
// });

// // Graceful shutdown
// process.on("SIGTERM", () => {
//   console.log("SIGTERM received. Shutting down gracefully...");
//   server.close(() => {
//     mongoose.connection.close(false, () => {
//       process.exit(0);
//     });
//   });
// });

// process.on("uncaughtException", (error) => {
//   console.error("💥 Uncaught Exception:", error);
//   process.exit(1);
// });
// server.js - Complete backend for TicketBari
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();

// ========== MIDDLEWARE SETUP ==========
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ========== DATABASE CONNECTION ==========
mongoose.set("strictQuery", false);
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ticketbari";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ========== FIREBASE ADMIN SETUP ==========
let firebaseApp;
try {
  const serviceAccountPath = path.join(
    __dirname,
    "ticketbari-projects-firebase-adminsdk-fbsvc-1d8b29239b.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    console.warn("⚠️ Firebase service account file not found! Running without Firebase...");
  } else {
    const serviceAccount = require(serviceAccountPath);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized");
  }
} catch (error) {
  console.error("❌ Firebase Admin Error:", error.message);
  console.log("Running without Firebase (JWT only mode)");
  firebaseApp = null;
}

// ========== MONGOOSE SCHEMAS & MODELS ==========
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: String,
    email: { type: String, required: true, lowercase: true, trim: true },
    photoURL: String,
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Ticket Schema
const ticketSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    transportType: {
      type: String,
      enum: ["bus", "train", "launch", "plane"],
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    availableQuantity: {
      type: Number,
      default: function () {
        return this.quantity;
      },
    },
    perks: [String],
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop",
    },
    departureAt: { type: Date, required: true, index: true },
    arrivalAt: Date,
    vendorId: { type: String, required: true, index: true },
    vendorName: String,
    verified: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    advertised: { type: Boolean, default: false, index: true },
    description: String,
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Booking Schema
const bookingSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: String,
    userEmail: String,
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    ticketTitle: String,
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    bookingDate: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
      index: true,
    },
    bookingReference: { type: String, unique: true },
  },
  {
    timestamps: true,
  }
);

// Vendor Application Schema
const vendorApplicationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    businessName: { type: String, required: true },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    businessType: { type: String, required: true },
    description: { type: String, required: true },
    website: { type: String },
    address: { type: String, required: true },
    taxId: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNotes: String,
  },
  {
    timestamps: true,
  }
);

// Models
const User = mongoose.model("User", userSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const VendorApplication = mongoose.model("VendorApplication", vendorApplicationSchema);

// ========== MIDDLEWARE FUNCTIONS ==========

// Validation Helper
const validateRequest = (req, res, next) => {
  const errors = [];

  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    errors.push("Invalid email format");
  }

  if (req.body.price && req.body.price < 0) {
    errors.push("Price cannot be negative");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Universal Auth Middleware
async function universalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided. Please login first.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (firebaseApp) {
      // Firebase Authentication
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      req.authType = "firebase";

      // Sync user with MongoDB
      const mongoUser = await User.findOneAndUpdate(
        { uid: decoded.uid },
        {
          uid: decoded.uid,
          name: decoded.name || decoded.email?.split("@")[0] || "User",
          email: decoded.email,
          photoURL: decoded.picture || "",
          updatedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      req.mongoUser = mongoUser;
    } else {
      // JWT Authentication (fallback)
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-change-in-production"
      );
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found. Please login again.",
        });
      }
      req.mongoUser = user;
      req.user = user;
      req.authType = "jwt";
    }

    next();
  } catch (err) {
    console.error("🔴 Auth Error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    res.status(401).json({
      success: false,
      message: "Authentication failed. Please login again.",
    });
  }
}

// Role Middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.mongoUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.mongoUser.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

// ========== ERROR HANDLER ==========
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  console.error(err.stack);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry found",
      field: Object.keys(err.keyPattern)[0],
    });
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

// ========== PUBLIC ROUTES ==========

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎫 TicketBari API is running!",
    version: "1.0.0",
    endpoints: {
      public: ["/api/health", "/api/advertised", "/api/tickets"],
      user: ["/api/user/profile", "/api/user/dashboard", "/api/my-bookings"],
      vendor: ["/api/apply-vendor", "/api/vendor/tickets"],
      admin: ["/api/admin/dashboard", "/api/admin/tickets", "/api/admin/users", "/api/admin/vendor-applications"],
    },
  });
});

// Health check
app.get("/api/health", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    firebase: firebaseApp ? "connected" : "not configured",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  res.json({ success: true, data: health });
});

// Advertised tickets
app.get("/api/advertised", async (req, res, next) => {
  try {
    const tickets = await Ticket.find({
      advertised: true,
      verified: "approved",
      isActive: true,
      departureAt: { $gte: new Date() },
    })
      .sort({ departureAt: 1 })
      .limit(12);

    res.json({
      success: true,
      data: { tickets },
    });
  } catch (error) {
    next(error);
  }
});

// All tickets with filtering
app.get("/api/tickets", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 8,
      transport = "",
      sort = "",
      from,
      to,
      minPrice,
      maxPrice,
      date,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = {
      verified: "approved",
      isActive: true,
    };

    if (transport && transport !== "") {
      filter.transportType = transport;
    }

    if (from && from !== "") {
      filter.from = new RegExp(from, "i");
    }

    if (to && to !== "") {
      filter.to = new RegExp(to, "i");
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (date && date !== "") {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.departureAt = { $gte: startDate, $lte: endDate };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };

    const [tickets, total] = await Promise.all([
      Ticket.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 0,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Single ticket
app.get("/api/tickets/:id", async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
    res.json({ success: true, data: { ticket } });
  } catch (error) {
    next(error);
  }
});

// ========== USER ROUTES ==========

// User profile
app.get("/api/user/profile", universalAuthMiddleware, async (req, res, next) => {
  try {
    res.json({ success: true, data: { user: req.mongoUser } });
  } catch (error) {
    next(error);
  }
});

// Update profile
app.put("/api/user/profile", universalAuthMiddleware, validateRequest, async (req, res, next) => {
  try {
    const { name, photoURL } = req.body;
    const userId = req.mongoUser._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (photoURL) updateData.photoURL = photoURL;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
});

// User dashboard
app.get("/api/user/dashboard", universalAuthMiddleware, async (req, res, next) => {
  try {
    const userId = req.mongoUser.uid || req.mongoUser._id;
    const [allBookings, pendingBookings, confirmedBookings, recentBookings] =
      await Promise.all([
        Booking.find({ userId }),
        Booking.find({ userId, status: "pending" }),
        Booking.find({ userId, status: "confirmed" }),
        Booking.find({ userId })
          .populate(
            "ticketId",
            "title from to departureAt transportType image price"
          )
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    const stats = {
      totalBooked: allBookings.length,
      pending: pendingBookings.length,
      confirmed: confirmedBookings.length,
      totalSpent: allBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    };

    res.json({
      success: true,
      data: { stats, recentBookings, user: req.mongoUser },
    });
  } catch (error) {
    next(error);
  }
});

// User bookings
app.get("/api/my-bookings", universalAuthMiddleware, async (req, res, next) => {
  try {
    const userId = req.mongoUser.uid || req.mongoUser._id;
    const bookings = await Booking.find({ userId })
      .populate("ticketId", "title from to departureAt transportType image")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { bookings } });
  } catch (error) {
    next(error);
  }
});

// Create booking
app.post("/api/bookings", universalAuthMiddleware, validateRequest, async (req, res, next) => {
  try {
    const { ticketId, quantity } = req.body;

    if (!ticketId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID and quantity (minimum 1) are required",
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.availableQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${ticket.availableQuantity} tickets available`,
      });
    }

    const booking = await Booking.create({
      userId: req.mongoUser.uid || req.mongoUser._id,
      userName: req.mongoUser.name || req.mongoUser.email.split("@")[0],
      userEmail: req.mongoUser.email,
      ticketId,
      ticketTitle: ticket.title,
      quantity,
      totalPrice: ticket.price * quantity,
      status: "pending",
    });

    // Update ticket availability
    ticket.availableQuantity -= quantity;
    await ticket.save();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
});

// ========== VENDOR APPLICATION ROUTES ==========

// Submit vendor application
app.post("/api/apply-vendor", universalAuthMiddleware, validateRequest, async (req, res, next) => {
  try {
    const {
      businessName,
      contactName,
      phone,
      businessType,
      description,
      website,
      address,
      taxId,
    } = req.body;

    const requiredFields = [
      "businessName",
      "contactName",
      "phone",
      "businessType",
      "description",
      "address",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (req.mongoUser.role === "vendor") {
      return res.status(400).json({
        success: false,
        message: "You are already a vendor",
      });
    }

    const existingApplication = await VendorApplication.findOne({
      userId: req.mongoUser.uid || req.mongoUser._id,
      status: "pending",
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending vendor application",
      });
    }

    const application = await VendorApplication.create({
      userId: req.mongoUser.uid || req.mongoUser._id,
      userName: req.mongoUser.name || req.mongoUser.email.split("@")[0],
      userEmail: req.mongoUser.email,
      businessName,
      contactName,
      phone,
      businessType,
      description,
      website,
      address,
      taxId,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Vendor application submitted successfully!",
      data: { application },
    });
  } catch (error) {
    next(error);
  }
});

// Get my vendor application
app.get("/api/my-vendor-application", universalAuthMiddleware, async (req, res, next) => {
  try {
    const application = await VendorApplication.findOne({
      userId: req.mongoUser.uid || req.mongoUser._id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: { application } });
  } catch (error) {
    next(error);
  }
});

// ========== VENDOR ROUTES ==========

// Get vendor tickets
app.get("/api/vendor/tickets", universalAuthMiddleware, requireRole(["vendor"]), async (req, res, next) => {
  try {
    const vendorId = req.mongoUser.uid || req.mongoUser._id;
    const tickets = await Ticket.find({ vendorId }).sort({ createdAt: -1 });
    res.json({ success: true, data: { tickets } });
  } catch (error) {
    next(error);
  }
});

// Create vendor ticket
app.post("/api/vendor/tickets", universalAuthMiddleware, requireRole(["vendor"]), validateRequest, async (req, res, next) => {
  try {
    const { title, from, to, transportType, price, quantity, departureAt } =
      req.body;

    const requiredFields = [
      "title",
      "from",
      "to",
      "transportType",
      "price",
      "quantity",
      "departureAt",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const newTicket = await Ticket.create({
      ...req.body,
      vendorId: req.mongoUser.uid || req.mongoUser._id,
      vendorName: req.mongoUser.name || req.mongoUser.email,
      availableQuantity: req.body.quantity,
      verified: "pending",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Ticket submitted for admin approval",
      data: { ticket: newTicket },
    });
  } catch (error) {
    next(error);
  }
});

// ========== ADMIN ROUTES ==========

// Admin dashboard
app.get("/api/admin/dashboard", universalAuthMiddleware, requireRole(["admin"]), async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTickets,
      totalBookings,
      pendingTickets,
      pendingVendorApplications,
      totalVendors,
      recentUsers,
      recentTickets,
    ] = await Promise.all([
      User.countDocuments(),
      Ticket.countDocuments(),
      Booking.countDocuments(),
      Ticket.countDocuments({ verified: "pending" }),
      VendorApplication.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "vendor" }),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),
      Ticket.find().sort({ createdAt: -1 }).limit(5).select("title from to price verified createdAt"),
    ]);

    // Get revenue data (from completed bookings)
    const revenueData = await Booking.aggregate([
      { $match: { status: "completed", paymentStatus: "paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          users: totalUsers,
          tickets: totalTickets,
          bookings: totalBookings,
          pendingApprovals: pendingTickets,
          pendingVendorApplications,
          vendors: totalVendors,
        },
        recent: {
          users: recentUsers,
          tickets: recentTickets,
        },
        revenue: revenueData,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Admin tickets management
app.get("/api/admin/tickets", universalAuthMiddleware, requireRole(["admin"]), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, verified } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = {};
    if (verified && verified !== "all") filter.verified = verified;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Ticket.countDocuments(filter),
    ]);

    // Get status counts
    const statusCounts = await Ticket.aggregate([
      {
        $group: {
          _id: "$verified",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total,
          pending: statusCounts.find(s => s._id === "pending")?.count || 0,
          approved: statusCounts.find(s => s._id === "approved")?.count || 0,
          rejected: statusCounts.find(s => s._id === "rejected")?.count || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Verify/Reject ticket
app.put("/api/admin/tickets/:id/verify", universalAuthMiddleware, requireRole(["admin"]), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'",
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.verified = status;
    ticket.isActive = status === "approved";
    await ticket.save();

    res.json({
      success: true,
      message: `Ticket ${status} successfully`,
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
});

// Admin users management
app.get("/api/admin/users", universalAuthMiddleware, requireRole(["admin"]), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = {};
    if (role && role !== "all") {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    // Get role counts
    const roleCounts = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total,
          admins: roleCounts.find(r => r._id === "admin")?.count || 0,
          vendors: roleCounts.find(r => r._id === "vendor")?.count || 0,
          regularUsers: roleCounts.find(r => r._id === "user")?.count || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user role
app.put("/api/admin/users/:id/role", universalAuthMiddleware, requireRole(["admin"]), async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user', 'vendor', or 'admin'",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// Admin vendor applications
app.get("/api/admin/vendor-applications", universalAuthMiddleware, requireRole(["admin"]), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = {};
    if (status) filter.status = status;

    const [applications, total] = await Promise.all([
      VendorApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("reviewedBy", "name email"),
      VendorApplication.countDocuments(filter),
    ]);

    const statusCounts = await VendorApplication.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total,
          pending: statusCounts.find(s => s._id === "pending")?.count || 0,
          approved: statusCounts.find(s => s._id === "approved")?.count || 0,
          rejected: statusCounts.find(s => s._id === "rejected")?.count || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single vendor application
app.get("/api/admin/vendor-applications/:id", universalAuthMiddleware, requireRole(["admin"]), async (req, res, next) => {
  try {
    const application = await VendorApplication.findById(req.params.id)
      .populate("reviewedBy", "name email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Vendor application not found",
      });
    }

    res.json({ success: true, data: { application } });
  } catch (error) {
    next(error);
  }
});

// Review vendor application
app.put("/api/admin/vendor-applications/:id/review", universalAuthMiddleware, requireRole(["admin"]), async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'",
      });
    }

    const application = await VendorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Vendor application not found",
      });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Application has already been reviewed",
      });
    }

    // Update application
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = req.mongoUser._id;
    application.reviewNotes = reviewNotes;
    await application.save();

    // If approved, update user role to vendor
    if (status === "approved") {
      await User.findOneAndUpdate(
        { uid: application.userId },
        { $set: { role: "vendor" } }
      );
    }

    res.json({
      success: true,
      message: `Vendor application ${status} successfully`,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
});

// ========== DEBUG & UTILITY ROUTES ==========

// Debug: Get all tickets (for testing)
app.get("/api/debug/tickets", async (req, res, next) => {
  try {
    const tickets = await Ticket.find({}).limit(50);
    res.json({
      success: true,
      data: {
        total: tickets.length,
        tickets: tickets.map(t => ({
          _id: t._id,
          title: t.title,
          from: t.from,
          to: t.to,
          verified: t.verified,
          isActive: t.isActive,
          departureAt: t.departureAt,
          price: t.price,
          transportType: t.transportType,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Debug: Approve all pending tickets
app.post("/api/debug/approve-all", async (req, res, next) => {
  try {
    const result = await Ticket.updateMany(
      { verified: "pending" },
      { $set: { verified: "approved", isActive: true } }
    );

    res.json({
      success: true,
      message: `Approved ${result.modifiedCount} pending tickets`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// ========== ERROR HANDLING & 404 ==========
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("=".repeat(50));
  console.log("🎫 TICKETBARI ADMIN SYSTEM ENABLED");
  console.log("=".repeat(50));
  console.log("📊 ADMIN ENDPOINTS:");
  console.log(`  GET  /api/admin/dashboard`);
  console.log(`  GET  /api/admin/tickets`);
  console.log(`  PUT  /api/admin/tickets/:id/verify`);
  console.log(`  GET  /api/admin/users`);
  console.log(`  PUT  /api/admin/users/:id/role`);
  console.log(`  GET  /api/admin/vendor-applications`);
  console.log(`  PUT  /api/admin/vendor-applications/:id/review`);
  console.log("=".repeat(50));
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
});