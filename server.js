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

// // Better CORS setup
// app.use(
//   cors({
//     origin: ["http://localhost:3000", "http://localhost:5173"],
//     credentials: true,
//   })
// );

// // Body parser
// app.use(bodyParser.json());

// // Add request logging
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
//   next();
// });

// // ---------- MongoDB Connection ----------
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

// // ---------- Firebase Admin ----------
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

// // ---------- Mongoose Schemas ----------
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
//     isActive: { type: Boolean, default: true }, // FIXED: Default should be true
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

// // ---------- Validation Helper ----------
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

// // ---------- Auth Middleware ----------
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

// // ---------- Role Middleware ----------
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

// // ---------- Error Handler ----------
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

// // ---------- Public Routes ----------
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "🎫 TicketBari API is running smoothly!",
//     version: "1.0.0",
//     note: "If tickets are not showing, check /api/debug/tickets to see database contents",
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

// // ---------- DEBUG ENDPOINTS ----------
// app.get("/api/debug/tickets", async (req, res) => {
//   try {
//     const allTickets = await Ticket.find({});
//     const approvedTickets = await Ticket.find({ verified: "approved" });
//     const pendingTickets = await Ticket.find({ verified: "pending" });
//     const activeTickets = await Ticket.find({ isActive: true });
//     const approvedActive = await Ticket.find({
//       verified: "approved",
//       isActive: true,
//     });
//     const futureTickets = await Ticket.find({
//       departureAt: { $gte: new Date() },
//     });
//     const approvedActiveFuture = await Ticket.find({
//       verified: "approved",
//       isActive: true,
//       departureAt: { $gte: new Date() },
//     });

//     res.json({
//       success: true,
//       data: {
//         totalTickets: allTickets.length,
//         approvedTickets: approvedTickets.length,
//         pendingTickets: pendingTickets.length,
//         activeTickets: activeTickets.length,
//         approvedActive: approvedActive.length,
//         futureTickets: futureTickets.length,
//         approvedActiveFuture: approvedActiveFuture.length,
//         sampleTicket: allTickets[0] || null,
//         allTickets: allTickets.map((t) => ({
//           _id: t._id,
//           title: t.title,
//           from: t.from,
//           to: t.to,
//           verified: t.verified,
//           isActive: t.isActive,
//           departureAt: t.departureAt,
//           daysUntil: t.departureAt
//             ? Math.floor(
//                 (new Date(t.departureAt) - new Date()) / (1000 * 60 * 60 * 24)
//               )
//             : "N/A",
//           price: t.price,
//           transportType: t.transportType,
//         })),
//       },
//     });
//   } catch (error) {
//     console.error("Debug error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // FIXED: This endpoint now approves AND activates tickets
// app.post("/api/debug/approve-all", async (req, res) => {
//   try {
//     const result = await Ticket.updateMany(
//       {},
//       {
//         $set: {
//           verified: "approved",
//           isActive: true,
//           advertised: true, // Also advertise them so they show in featured section
//         },
//       }
//     );

//     res.json({
//       success: true,
//       message: `✅ Approved and activated ${result.modifiedCount} tickets`,
//       details: {
//         modifiedCount: result.modifiedCount,
//         matchedCount: result.matchedCount,
//       },
//     });
//   } catch (error) {
//     console.error("Approve error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // NEW: Add an endpoint to only activate approved tickets
// app.post("/api/debug/activate-approved", async (req, res) => {
//   try {
//     const result = await Ticket.updateMany(
//       { verified: "approved" },
//       { $set: { isActive: true } }
//     );

//     res.json({
//       success: true,
//       message: `✅ Activated ${result.modifiedCount} approved tickets`,
//       details: {
//         modifiedCount: result.modifiedCount,
//         matchedCount: result.matchedCount,
//       },
//     });
//   } catch (error) {
//     console.error("Activate error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ---------- ADVERTISED TICKETS ----------
// app.get("/api/advertised", async (req, res, next) => {
//   try {
//     const tickets = await Ticket.find({
//       advertised: true,
//       verified: "approved",
//       isActive: true,
//     })
//       .sort({ departureAt: 1 })
//       .limit(6);

//     res.json({
//       success: true,
//       data: {
//         tickets,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // ---------- FIXED: ALL TICKETS ENDPOINT (MAIN FIX) ----------
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

//     console.log("📥 Tickets API Request:", req.query);

//     // Build filter object - FIXED: Only show approved and active tickets
//     const filter = {
//       verified: "approved",
//       isActive: true,
//     };

//     // DEBUG: Check what we have in DB
//     console.log("🔍 DEBUG: Getting all approved, active tickets...");
//     const allApprovedActive = await Ticket.find(filter);
//     console.log(
//       `🔍 DEBUG: Found ${allApprovedActive.length} approved & active tickets`
//     );

//     // Add transport filter if specified
//     if (transport && transport !== "") {
//       filter.transportType = transport;
//       console.log(`🔍 DEBUG: Filtering by transport: ${transport}`);
//     }

//     // Add from/to filters if specified
//     if (from && from !== "") {
//       filter.from = new RegExp(from, "i");
//     }

//     if (to && to !== "") {
//       filter.to = new RegExp(to, "i");
//     }

//     // Price range filters
//     if (minPrice || maxPrice) {
//       filter.price = {};
//       if (minPrice) filter.price.$gte = Number(minPrice);
//       if (maxPrice) filter.price.$lte = Number(maxPrice);
//     }

//     // REMOVE departure date filter to show ALL tickets regardless of date
//     // This is the main fix - your tickets likely have past dates
//     // If you want to filter by date in the future, uncomment the line below:
//     // filter.departureAt = { $gte: new Date() };

//     // Only add departure filter if date is provided
//     if (date && date !== "") {
//       const startDate = new Date(date);
//       startDate.setHours(0, 0, 0, 0);
//       const endDate = new Date(date);
//       endDate.setHours(23, 59, 59, 999);
//       filter.departureAt = { $gte: startDate, $lte: endDate };
//     }

//     console.log("🔍 Final MongoDB Filter:", JSON.stringify(filter, null, 2));

//     // Build sort object
//     let sortOption = { createdAt: -1 }; // Default: newest first

//     if (sort === "price_asc") {
//       sortOption = { price: 1 };
//     } else if (sort === "price_desc") {
//       sortOption = { price: -1 };
//     }

//     // Execute queries
//     const [tickets, total] = await Promise.all([
//       Ticket.find(filter).sort(sortOption).skip(skip).limit(limitNum),
//       Ticket.countDocuments(filter),
//     ]);

//     console.log(
//       `✅ FINAL: Found ${tickets.length} tickets out of ${total} total`
//     );

//     if (tickets.length > 0) {
//       console.log(
//         "✅ Sample tickets:",
//         tickets.slice(0, 2).map((t) => ({
//           title: t.title,
//           verified: t.verified,
//           isActive: t.isActive,
//           departureAt: t.departureAt,
//           price: t.price,
//           transportType: t.transportType,
//         }))
//       );
//     }

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
//     console.error("❌ Error in /api/tickets:", error);
//     next(error);
//   }
// });

// // ---------- SINGLE TICKET ----------
// app.get("/api/tickets/:id", async (req, res, next) => {
//   try {
//     const ticket = await Ticket.findById(req.params.id);

//     if (!ticket) {
//       return res.status(404).json({
//         success: false,
//         message: "Ticket not found",
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         ticket,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // ---------- USER ROUTES ----------
// app.get(
//   "/api/my-bookings",
//   universalAuthMiddleware,
//   requireRole(["user"]),
//   async (req, res, next) => {
//     try {
//       const userId = req.mongoUser.uid || req.mongoUser._id;
//       const bookings = await Booking.find({ userId })
//         .populate("ticketId", "title from to departureAt transportType image")
//         .sort({ createdAt: -1 });

//       res.json({
//         success: true,
//         data: {
//           bookings,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.post(
//   "/api/bookings",
//   universalAuthMiddleware,
//   requireRole(["user"]),
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

//       // Update ticket availability
//       ticket.availableQuantity -= quantity;
//       await ticket.save();

//       res.status(201).json({
//         success: true,
//         message: "Booking created successfully",
//         data: {
//           booking,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // ---------- VENDOR ROUTES ----------
// app.get(
//   "/api/vendor/tickets",
//   universalAuthMiddleware,
//   requireRole(["vendor"]),
//   async (req, res, next) => {
//     try {
//       const vendorId = req.mongoUser.uid || req.mongoUser._id;
//       const tickets = await Ticket.find({ vendorId }).sort({ createdAt: -1 });

//       res.json({
//         success: true,
//         data: {
//           tickets,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // FIXED: Vendor ticket creation - tickets should be active by default
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

//       if (price < 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Price cannot be negative",
//         });
//       }

//       if (quantity < 1) {
//         return res.status(400).json({
//           success: false,
//           message: "Quantity must be at least 1",
//         });
//       }

//       const newTicket = await Ticket.create({
//         ...req.body,
//         vendorId: req.mongoUser.uid || req.mongoUser._id,
//         vendorName: req.mongoUser.name || req.mongoUser.email,
//         availableQuantity: req.body.quantity,
//         verified: "pending",
//         isActive: true, // FIXED: Tickets should be active by default
//       });

//       res.status(201).json({
//         success: true,
//         message: "Ticket submitted for admin approval",
//         data: {
//           ticket: newTicket,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // ---------- ADMIN ROUTES ----------
// app.get(
//   "/api/admin/dashboard",
//   universalAuthMiddleware,
//   requireRole(["admin"]),
//   async (req, res, next) => {
//     try {
//       const [totalUsers, totalTickets, totalBookings, pendingTickets] =
//         await Promise.all([
//           User.countDocuments(),
//           Ticket.countDocuments(),
//           Booking.countDocuments(),
//           Ticket.countDocuments({ verified: "pending" }),
//         ]);

//       res.json({
//         success: true,
//         data: {
//           users: totalUsers,
//           tickets: totalTickets,
//           bookings: totalBookings,
//           pendingApprovals: pendingTickets,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // FIXED: Admin approval - activate tickets when approved
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
//       ticket.isActive = status === "approved"; // FIXED: Activate when approved
//       await ticket.save();

//       res.json({
//         success: true,
//         message: `Ticket ${status} successfully`,
//         data: {
//           ticket,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // ---------- Apply Error Handler ----------
// app.use(errorHandler);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.method} ${req.url}`,
//   });
// });

// // ---------- Start Server ----------
// const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   console.log("==========================================");
//   console.log("🔧 TICKET DISPLAY FIX APPLIED:");
//   console.log(
//     "1. Added /api/debug/approve-all to approve AND activate tickets"
//   );
//   console.log(
//     "2. Added /api/debug/activate-approved to only activate approved tickets"
//   );
//   console.log(
//     "3. Fixed vendor ticket creation - tickets are now active by default"
//   );
//   console.log("4. Fixed admin approval - tickets are activated when approved");
//   console.log("5. To fix existing tickets, visit: POST /api/debug/approve-all");
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

// Better CORS setup
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Body parser
app.use(bodyParser.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// ---------- MongoDB Connection ----------
mongoose.set("strictQuery", false);
const MONGO_URI = process.env.MONGO_URI;

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
  });

// ---------- Firebase Admin ----------
let firebaseApp;
try {
  const serviceAccountPath = path.join(
    __dirname,
    "ticketbari-projects-firebase-adminsdk-fbsvc-1d8b29239b.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("Firebase service account file not found!");
  }

  const serviceAccount = require(serviceAccountPath);
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized");
} catch (error) {
  console.error("❌ Firebase Admin Error:", error.message);
  console.log("Running without Firebase (JWT only mode)");
  firebaseApp = null;
}

// ---------- Mongoose Schemas ----------
const { Schema } = mongoose;

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

bookingSchema.pre("save", function (next) {
  if (!this.bookingReference) {
    this.bookingReference =
      "TB-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

const User = mongoose.model("User", userSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);
const Booking = mongoose.model("Booking", bookingSchema);

// ---------- Validation Helper ----------
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

// ---------- Auth Middleware ----------
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
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      req.authType = "firebase";

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

// ---------- Role Middleware ----------
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

// ---------- Error Handler ----------
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);

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
  });
};

// ---------- Public Routes ----------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎫 TicketBari API is running smoothly!",
    version: "1.0.0",
    note: "If tickets are not showing, check /api/debug/tickets to see database contents",
  });
});

app.get("/api/health", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    firebase: firebaseApp ? "connected" : "not configured",
  };

  res.json({ success: true, data: health });
});

// ---------- DEBUG ENDPOINTS ----------
app.get("/api/debug/tickets", async (req, res) => {
  try {
    const allTickets = await Ticket.find({});
    const approvedTickets = await Ticket.find({ verified: "approved" });
    const pendingTickets = await Ticket.find({ verified: "pending" });
    const activeTickets = await Ticket.find({ isActive: true });
    const approvedActive = await Ticket.find({
      verified: "approved",
      isActive: true,
    });
    const futureTickets = await Ticket.find({
      departureAt: { $gte: new Date() },
    });
    const approvedActiveFuture = await Ticket.find({
      verified: "approved",
      isActive: true,
      departureAt: { $gte: new Date() },
    });

    res.json({
      success: true,
      data: {
        totalTickets: allTickets.length,
        approvedTickets: approvedTickets.length,
        pendingTickets: pendingTickets.length,
        activeTickets: activeTickets.length,
        approvedActive: approvedActive.length,
        futureTickets: futureTickets.length,
        approvedActiveFuture: approvedActiveFuture.length,
        sampleTicket: allTickets[0] || null,
        allTickets: allTickets.map((t) => ({
          _id: t._id,
          title: t.title,
          from: t.from,
          to: t.to,
          verified: t.verified,
          isActive: t.isActive,
          departureAt: t.departureAt,
          daysUntil: t.departureAt
            ? Math.floor(
                (new Date(t.departureAt) - new Date()) / (1000 * 60 * 60 * 24)
              )
            : "N/A",
          price: t.price,
          transportType: t.transportType,
        })),
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DEBUG: Test filter logic endpoint
app.get("/api/debug/test-filter", async (req, res) => {
  try {
    console.log("🔍 DEBUG: Testing filter logic...");

    // Test 1: Show ALL tickets
    const allTickets = await Ticket.find({});
    console.log(`1. Total tickets in DB: ${allTickets.length}`);

    // Test 2: Show approved tickets
    const approvedTickets = await Ticket.find({ verified: "approved" });
    console.log(`2. Approved tickets: ${approvedTickets.length}`);

    // Test 3: Show active tickets
    const activeTickets = await Ticket.find({ isActive: true });
    console.log(`3. Active tickets: ${activeTickets.length}`);

    // Test 4: Show approved AND active (current filter)
    const approvedActive = await Ticket.find({
      verified: "approved",
      isActive: true,
    });
    console.log(
      `4. Approved & Active (current filter): ${approvedActive.length}`
    );

    // Test 5: Show ANY ticket regardless of status
    const anyTickets = await Ticket.find({}).limit(5);

    res.json({
      success: true,
      debug: {
        totalInDB: allTickets.length,
        approved: approvedTickets.length,
        active: activeTickets.length,
        approvedActive: approvedActive.length,
        sampleTickets: anyTickets.map((t) => ({
          _id: t._id,
          title: t.title,
          verified: t.verified,
          isActive: t.isActive,
          departureAt: t.departureAt,
        })),
      },
    });
  } catch (error) {
    console.error("Debug test error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// FIXED: This endpoint now approves AND activates tickets
app.post("/api/debug/approve-all", async (req, res) => {
  try {
    const result = await Ticket.updateMany(
      {},
      {
        $set: {
          verified: "approved",
          isActive: true,
          advertised: true,
        },
      }
    );

    res.json({
      success: true,
      message: `✅ Approved and activated ${result.modifiedCount} tickets`,
      details: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Add an endpoint to only activate approved tickets
app.post("/api/debug/activate-approved", async (req, res) => {
  try {
    const result = await Ticket.updateMany(
      { verified: "approved" },
      { $set: { isActive: true } }
    );

    res.json({
      success: true,
      message: `✅ Activated ${result.modifiedCount} approved tickets`,
      details: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  } catch (error) {
    console.error("Activate error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DEBUG: Temporary endpoint to show ALL tickets
app.get("/api/tickets-debug", async (req, res, next) => {
  try {
    console.log("🔍 DEBUG: /api/tickets-debug - Showing ALL tickets");

    const tickets = await Ticket.find({}).limit(20);

    console.log(`✅ Found ${tickets.length} tickets total`);

    res.json({
      success: true,
      message: "DEBUG MODE: Showing all tickets",
      debug: {
        total: tickets.length,
        filterApplied: "NONE - showing all tickets",
      },
      data: {
        tickets,
        pagination: {
          page: 1,
          limit: 20,
          total: tickets.length,
          pages: 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in /api/tickets-debug:", error);
    next(error);
  }
});

// ---------- ADVERTISED TICKETS ----------
app.get("/api/advertised", async (req, res, next) => {
  try {
    const tickets = await Ticket.find({
      advertised: true,
      verified: "approved",
      isActive: true,
    })
      .sort({ departureAt: 1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        tickets,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------- FIXED: ALL TICKETS ENDPOINT (MAIN FIX) ----------
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
      debug = false, // Add debug parameter
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    console.log("📥 Tickets API Request:", req.query);

    // Build filter object - TEMPORARY FIX: Show approved tickets regardless of isActive
    let filter = {};

    if (debug === "true") {
      console.log("🔍 DEBUG MODE: Showing ALL tickets");
      filter = {}; // Show everything
    } else {
      // TEMPORARY: Show approved tickets, ignore isActive for now
      filter = {
        verified: "approved",
        // isActive: true, // Commented out temporarily
      };
      console.log(
        "⚠️ TEMPORARY: Showing approved tickets (isActive check disabled)"
      );
    }

    // DEBUG: Check what we have in DB
    console.log(
      "🔍 Getting tickets with filter:",
      JSON.stringify(filter, null, 2)
    );
    const filteredTickets = await Ticket.find(filter);
    console.log(
      `🔍 Found ${filteredTickets.length} tickets with current filter`
    );

    // Add transport filter if specified
    if (transport && transport !== "") {
      filter.transportType = transport;
      console.log(`🔍 Filtering by transport: ${transport}`);
    }

    // Add from/to filters if specified
    if (from && from !== "") {
      filter.from = new RegExp(from, "i");
    }

    if (to && to !== "") {
      filter.to = new RegExp(to, "i");
    }

    // Price range filters
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Only add departure filter if date is provided
    if (date && date !== "") {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.departureAt = { $gte: startDate, $lte: endDate };
    }

    console.log("🔍 Final MongoDB Filter:", JSON.stringify(filter, null, 2));

    // Build sort object
    let sortOption = { createdAt: -1 }; // Default: newest first

    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    }

    // Execute queries
    const [tickets, total] = await Promise.all([
      Ticket.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Ticket.countDocuments(filter),
    ]);

    console.log(
      `✅ FINAL: Found ${tickets.length} tickets out of ${total} total`
    );

    if (tickets.length > 0) {
      console.log(
        "✅ Sample tickets:",
        tickets.slice(0, 2).map((t) => ({
          id: t._id,
          title: t.title,
          verified: t.verified,
          isActive: t.isActive,
          departureAt: t.departureAt,
          price: t.price,
          transportType: t.transportType,
        }))
      );
    } else {
      console.log("⚠️ No tickets found with filter:", filter);
      console.log(
        "💡 Try: POST /api/debug/approve-all to approve and activate tickets"
      );
    }

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
    console.error("❌ Error in /api/tickets:", error);
    next(error);
  }
});

// ---------- SINGLE TICKET ----------
app.get("/api/tickets/:id", async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------- USER ROUTES ----------
app.get(
  "/api/my-bookings",
  universalAuthMiddleware,
  requireRole(["user"]),
  async (req, res, next) => {
    try {
      const userId = req.mongoUser.uid || req.mongoUser._id;
      const bookings = await Booking.find({ userId })
        .populate("ticketId", "title from to departureAt transportType image")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          bookings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/bookings",
  universalAuthMiddleware,
  requireRole(["user"]),
  validateRequest,
  async (req, res, next) => {
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
        data: {
          booking,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ---------- VENDOR ROUTES ----------
app.get(
  "/api/vendor/tickets",
  universalAuthMiddleware,
  requireRole(["vendor"]),
  async (req, res, next) => {
    try {
      const vendorId = req.mongoUser.uid || req.mongoUser._id;
      const tickets = await Ticket.find({ vendorId }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          tickets,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// FIXED: Vendor ticket creation - tickets should be active by default
app.post(
  "/api/vendor/tickets",
  universalAuthMiddleware,
  requireRole(["vendor"]),
  validateRequest,
  async (req, res, next) => {
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

      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: "Price cannot be negative",
        });
      }

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      const newTicket = await Ticket.create({
        ...req.body,
        vendorId: req.mongoUser.uid || req.mongoUser._id,
        vendorName: req.mongoUser.name || req.mongoUser.email,
        availableQuantity: req.body.quantity,
        verified: "pending",
        isActive: true, // FIXED: Tickets should be active by default
      });

      res.status(201).json({
        success: true,
        message: "Ticket submitted for admin approval",
        data: {
          ticket: newTicket,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ---------- ADMIN ROUTES ----------
app.get(
  "/api/admin/dashboard",
  universalAuthMiddleware,
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      const [totalUsers, totalTickets, totalBookings, pendingTickets] =
        await Promise.all([
          User.countDocuments(),
          Ticket.countDocuments(),
          Booking.countDocuments(),
          Ticket.countDocuments({ verified: "pending" }),
        ]);

      res.json({
        success: true,
        data: {
          users: totalUsers,
          tickets: totalTickets,
          bookings: totalBookings,
          pendingApprovals: pendingTickets,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// FIXED: Admin approval - activate tickets when approved
app.put(
  "/api/admin/tickets/:id/verify",
  universalAuthMiddleware,
  requireRole(["admin"]),
  async (req, res, next) => {
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
      ticket.isActive = status === "approved"; // FIXED: Activate when approved
      await ticket.save();

      res.json({
        success: true,
        message: `Ticket ${status} successfully`,
        data: {
          ticket,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ---------- Apply Error Handler ----------
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("==========================================");
  console.log("🔧 TICKET DISPLAY FIX APPLIED:");
  console.log("1. Added /api/debug/test-filter to diagnose filter issues");
  console.log("2. Added /api/tickets-debug to show ALL tickets");
  console.log(
    "3. /api/tickets now shows approved tickets (isActive temporarily disabled)"
  );
  console.log("4. To fix tickets: POST /api/debug/approve-all");
  console.log("5. Test: GET /api/debug/test-filter");
  console.log("6. Debug: GET /api/tickets-debug");
  console.log("==========================================");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});
