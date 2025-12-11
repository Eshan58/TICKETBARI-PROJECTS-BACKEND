// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const admin = require("firebase-admin");
// const bodyParser = require("body-parser");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // Fix Mongoose deprecation warning
// mongoose.set("strictQuery", false);

// // ---------- Load Firebase Admin from JSON file ----------
// const serviceAccountPath = path.join(
//   __dirname,
//   "ticketbari-projects-firebase-adminsdk-fbsvc-1d8b29239b.json"
// );

// if (!fs.existsSync(serviceAccountPath)) {
//   console.error(
//     "Firebase service account JSON file not found at:",
//     serviceAccountPath
//   );
//   console.error(
//     "Please ensure the JSON file is in the same directory as server.js"
//   );
//   process.exit(1);
// }

// try {
//   const serviceAccount = require(serviceAccountPath);
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
//   console.log("✅ Firebase Admin initialized successfully");
// } catch (error) {
//   console.error("❌ Failed to initialize Firebase Admin:", error.message);
//   process.exit(1);
// }

// // ---------- MongoDB Atlas Connection ----------
// const MONGO_URI = process.env.MONGO_URI;
// if (!MONGO_URI) {
//   console.error("❌ MONGO_URI not set in .env file");
//   process.exit(1);
// }

// console.log("🔗 Connecting to MongoDB Atlas...");

// mongoose
//   .connect(MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 10000, // 10 seconds
//     socketTimeoutMS: 45000,
//   })
//   .then(() => {
//     console.log("✅ MongoDB Atlas connected successfully!");
//     console.log(`📊 Database: ${mongoose.connection.name}`);
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB Atlas connection error:", err.message);
//     console.log("⚠️ Starting server without MongoDB - using mock data");
//   });

// // ---------- Mongoose Schemas ----------
// const { Schema } = mongoose;

// const UserSchema = new Schema({
//   uid: { type: String, required: true, unique: true },
//   name: String,
//   email: { type: String, required: true },
//   photoURL: String,
//   role: { type: String, enum: ["user", "vendor", "admin"], default: "user" },
//   createdAt: { type: Date, default: Date.now },
// });
// const User = mongoose.model("User", UserSchema);

// const TicketSchema = new Schema({
//   title: { type: String, required: true },
//   from: { type: String, required: true },
//   to: { type: String, required: true },
//   transportType: {
//     type: String,
//     enum: ["bus", "train", "launch", "plane"],
//     required: true,
//   },
//   price: { type: Number, required: true, min: 0 },
//   quantity: { type: Number, required: true, min: 0 },
//   perks: [String],
//   image: String,
//   departureAt: { type: Date, required: true },
//   vendorId: { type: String, required: true },
//   vendorName: String,
//   verified: {
//     type: String,
//     enum: ["pending", "approved", "rejected"],
//     default: "pending",
//   },
//   advertised: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
// });
// const Ticket = mongoose.model("Ticket", TicketSchema);

// const BookingSchema = new Schema({
//   userId: { type: String, required: true },
//   userName: String,
//   userEmail: String,
//   ticketId: { type: String, required: true },
//   ticketTitle: String,
//   quantity: { type: Number, required: true, min: 1 },
//   totalPrice: { type: Number, required: true, min: 0 },
//   status: {
//     type: String,
//     enum: ["pending", "accepted", "rejected", "paid"],
//     default: "pending",
//   },
//   createdAt: { type: Date, default: Date.now },
// });
// const Booking = mongoose.model("Booking", BookingSchema);

// const TransactionSchema = new Schema({
//   bookingId: { type: String, required: true },
//   transactionId: { type: String, required: true },
//   amount: { type: Number, required: true, min: 0 },
//   ticketTitle: String,
//   userId: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now },
// });
// const Transaction = mongoose.model("Transaction", TransactionSchema);

// // ---------- Middleware to verify Firebase ID token ----------
// async function verifyFirebaseToken(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized - No token provided" });
//   }
//   const idToken = authHeader.split("Bearer ")[1];
//   try {
//     const decoded = await admin.auth().verifyIdToken(idToken);

//     // Upsert user in DB if MongoDB is connected
//     if (mongoose.connection.readyState === 1) {
//       try {
//         await User.findOneAndUpdate(
//           { uid: decoded.uid },
//           {
//             uid: decoded.uid,
//             name: decoded.name || "",
//             email: decoded.email,
//             photoURL: decoded.picture || "",
//           },
//           { upsert: true, new: true }
//         );
//       } catch (dbError) {
//         console.warn("Database user upsert failed:", dbError.message);
//       }
//     }

//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.error("Token verification failed:", err.message);
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// }

// // ---------- Utility: role-based middleware ----------
// const requireRole = (role) => async (req, res, next) => {
//   if (!req.user) return res.status(401).json({ message: "Unauthorized" });

//   if (mongoose.connection.readyState !== 1) {
//     console.warn("MongoDB not connected, skipping role check");
//     return next();
//   }

//   try {
//     const dbUser = await User.findOne({ uid: req.user.uid });
//     if (!dbUser || dbUser.role !== role) {
//       return res
//         .status(403)
//         .json({ message: "Forbidden - Insufficient permissions" });
//     }
//     next();
//   } catch (error) {
//     console.error("Role check failed:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// // ---------- Health Check Route ----------
// app.get("/", (req, res) => {
//   res.json({
//     status: "ok",
//     service: "TicketBari Backend API",
//     version: "1.0.0",
//     mongodb:
//       mongoose.connection.readyState === 1 ? "connected" : "disconnected",
//     firebase: "initialized",
//     timestamp: new Date().toISOString(),
//   });
// });

// // ---------- Public Routes ----------

// // Get advertised tickets (with mock data fallback)
// app.get("/api/advertised", async (req, res) => {
//   if (mongoose.connection.readyState !== 1) {
//     console.log("⚠️ Using mock advertised data (MongoDB not connected)");
//     return res.json([
//       {
//         _id: "1",
//         title: "Express Bus to Cox's Bazar",
//         from: "Dhaka",
//         to: "Cox's Bazar",
//         price: 1200,
//         image:
//           "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop",
//         transportType: "bus",
//         departureAt: new Date(Date.now() + 86400000 * 2).toISOString(),
//         quantity: 15,
//       },
//       {
//         _id: "2",
//         title: "Sundarban Tour Launch",
//         from: "Khulna",
//         to: "Sundarban",
//         price: 2500,
//         image:
//           "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop",
//         transportType: "launch",
//         departureAt: new Date(Date.now() + 86400000 * 3).toISOString(),
//         quantity: 8,
//       },
//       {
//         _id: "3",
//         title: "Intercity Train to Sylhet",
//         from: "Dhaka",
//         to: "Sylhet",
//         price: 800,
//         image:
//           "https://images.unsplash.com/photo-1516053256215-940222132676?w=500&auto=format&fit=crop",
//         transportType: "train",
//         departureAt: new Date(Date.now() + 86400000).toISOString(),
//         quantity: 20,
//       },
//     ]);
//   }

//   try {
//     const advertisedTickets = await Ticket.find({
//       verified: "approved",
//       advertised: true,
//       departureAt: { $gt: new Date() },
//       quantity: { $gt: 0 },
//     })
//       .limit(6)
//       .sort({ createdAt: -1 });

//     res.json(advertisedTickets);
//   } catch (error) {
//     console.error("Error fetching advertised tickets:", error);
//     res.status(500).json({ message: "Failed to fetch advertised tickets" });
//   }
// });

// // Get all tickets with pagination and filtering
// app.get("/api/tickets", async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 8;
//   const transport = req.query.transport;
//   const from = req.query.from;
//   const to = req.query.to;
//   const sort = req.query.sort;
//   const minPrice = parseFloat(req.query.minPrice);
//   const maxPrice = parseFloat(req.query.maxPrice);

//   // Build filter
//   const filter = {
//     verified: "approved",
//     departureAt: { $gt: new Date() },
//     quantity: { $gt: 0 },
//   };

//   if (transport && ["bus", "train", "launch", "plane"].includes(transport)) {
//     filter.transportType = transport;
//   }
//   if (from) filter.from = { $regex: from, $options: "i" };
//   if (to) filter.to = { $regex: to, $options: "i" };
//   if (!isNaN(minPrice)) filter.price = { $gte: minPrice };
//   if (!isNaN(maxPrice)) {
//     filter.price = filter.price || {};
//     filter.price.$lte = maxPrice;
//   }

//   if (mongoose.connection.readyState !== 1) {
//     console.log("⚠️ Using mock tickets data (MongoDB not connected)");
//     return res.json({
//       total: 0,
//       page,
//       limit,
//       tickets: [],
//     });
//   }

//   try {
//     let query = Ticket.find(filter);

//     // Sorting
//     if (sort === "price_asc") query = query.sort({ price: 1 });
//     else if (sort === "price_desc") query = query.sort({ price: -1 });
//     else if (sort === "departure_asc") query = query.sort({ departureAt: 1 });
//     else query = query.sort({ createdAt: -1 });

//     const total = await Ticket.countDocuments(filter);
//     const tickets = await query.skip((page - 1) * limit).limit(limit);

//     res.json({
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       tickets,
//     });
//   } catch (error) {
//     console.error("Error fetching tickets:", error);
//     res.status(500).json({ message: "Failed to fetch tickets" });
//   }
// });

// // Get single ticket details
// app.get("/api/tickets/:id", async (req, res) => {
//   const { id } = req.params;

//   if (mongoose.connection.readyState !== 1) {
//     return res
//       .status(404)
//       .json({ message: "Ticket not found (Database not connected)" });
//   }

//   try {
//     const ticket = await Ticket.findById(id);
//     if (!ticket) {
//       return res.status(404).json({ message: "Ticket not found" });
//     }
//     res.json(ticket);
//   } catch (error) {
//     console.error("Error fetching ticket:", error);
//     res.status(500).json({ message: "Failed to fetch ticket details" });
//   }
// });

// // ---------- Protected Routes (Require Authentication) ----------

// // Create a booking
// app.post("/api/bookings", verifyFirebaseToken, async (req, res) => {
//   const { ticketId, quantity } = req.body;

//   if (!ticketId || !quantity || quantity < 1) {
//     return res
//       .status(400)
//       .json({ message: "Ticket ID and quantity (minimum 1) are required" });
//   }

//   if (mongoose.connection.readyState !== 1) {
//     return res
//       .status(503)
//       .json({ message: "Database not available. Please try again later." });
//   }

//   try {
//     const ticket = await Ticket.findById(ticketId);
//     if (!ticket) {
//       return res.status(404).json({ message: "Ticket not found" });
//     }

//     if (ticket.verified !== "approved") {
//       return res
//         .status(400)
//         .json({ message: "This ticket is not approved for booking" });
//     }

//     if (new Date(ticket.departureAt) <= new Date()) {
//       return res
//         .status(400)
//         .json({ message: "This ticket has already departed" });
//     }

//     if (ticket.quantity < quantity) {
//       return res.status(400).json({
//         message: `Only ${ticket.quantity} tickets available`,
//         available: ticket.quantity,
//       });
//     }

//     // Calculate total price
//     const totalPrice = ticket.price * quantity;

//     // Create booking
//     const booking = new Booking({
//       userId: req.user.uid,
//       userName: req.user.name || req.user.email,
//       userEmail: req.user.email,
//       ticketId,
//       ticketTitle: ticket.title,
//       quantity,
//       totalPrice,
//       status: "pending",
//     });

//     await booking.save();

//     res.status(201).json({
//       message: "Booking created successfully",
//       booking,
//       ticket: {
//         title: ticket.title,
//         from: ticket.from,
//         to: ticket.to,
//         departureAt: ticket.departureAt,
//       },
//     });
//   } catch (error) {
//     console.error("Error creating booking:", error);
//     res.status(500).json({ message: "Failed to create booking" });
//   }
// });

// // Get user's bookings
// app.get("/api/my-bookings", verifyFirebaseToken, async (req, res) => {
//   if (mongoose.connection.readyState !== 1) {
//     return res.json([]);
//   }

//   try {
//     const bookings = await Booking.find({ userId: req.user.uid })
//       .sort({ createdAt: -1 })
//       .populate("ticketId", "title from to departureAt");

//     res.json(bookings);
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     res.status(500).json({ message: "Failed to fetch bookings" });
//   }
// });

// // ---------- Vendor Routes ----------

// // Add new ticket (Vendor only)
// app.post(
//   "/api/tickets",
//   verifyFirebaseToken,
//   requireRole("vendor"),
//   async (req, res) => {
//     const ticketData = req.body;

//     // Validate required fields
//     const requiredFields = [
//       "title",
//       "from",
//       "to",
//       "transportType",
//       "price",
//       "quantity",
//       "departureAt",
//     ];
//     for (const field of requiredFields) {
//       if (!ticketData[field]) {
//         return res.status(400).json({ message: `${field} is required` });
//       }
//     }

//     if (mongoose.connection.readyState !== 1) {
//       return res.status(503).json({ message: "Database not available" });
//     }

//     try {
//       // Get vendor info
//       const vendor = await User.findOne({ uid: req.user.uid });

//       const newTicket = new Ticket({
//         ...ticketData,
//         vendorId: req.user.uid,
//         vendorName: vendor?.name || req.user.email,
//         verified: "pending",
//         advertised: false,
//       });

//       await newTicket.save();

//       res.status(201).json({
//         message: "Ticket submitted for approval",
//         ticket: newTicket,
//       });
//     } catch (error) {
//       console.error("Error creating ticket:", error);
//       res.status(500).json({ message: "Failed to create ticket" });
//     }
//   }
// );

// // Get vendor's tickets
// app.get(
//   "/api/vendor/tickets",
//   verifyFirebaseToken,
//   requireRole("vendor"),
//   async (req, res) => {
//     if (mongoose.connection.readyState !== 1) {
//       return res.json([]);
//     }

//     try {
//       const tickets = await Ticket.find({ vendorId: req.user.uid }).sort({
//         createdAt: -1,
//       });

//       res.json(tickets);
//     } catch (error) {
//       console.error("Error fetching vendor tickets:", error);
//       res.status(500).json({ message: "Failed to fetch tickets" });
//     }
//   }
// );

// // ---------- Admin Routes ----------

// // Get all tickets for admin approval
// app.get(
//   "/api/admin/tickets",
//   verifyFirebaseToken,
//   requireRole("admin"),
//   async (req, res) => {
//     if (mongoose.connection.readyState !== 1) {
//       return res.json([]);
//     }

//     try {
//       const tickets = await Ticket.find().sort({ createdAt: -1 });

//       res.json(tickets);
//     } catch (error) {
//       console.error("Error fetching admin tickets:", error);
//       res.status(500).json({ message: "Failed to fetch tickets" });
//     }
//   }
// );

// // Approve a ticket
// app.patch(
//   "/api/admin/tickets/:id/approve",
//   verifyFirebaseToken,
//   requireRole("admin"),
//   async (req, res) => {
//     const { id } = req.params;

//     if (mongoose.connection.readyState !== 1) {
//       return res.status(503).json({ message: "Database not available" });
//     }

//     try {
//       const ticket = await Ticket.findByIdAndUpdate(
//         id,
//         { verified: "approved" },
//         { new: true }
//       );

//       if (!ticket) {
//         return res.status(404).json({ message: "Ticket not found" });
//       }

//       res.json({
//         message: "Ticket approved successfully",
//         ticket,
//       });
//     } catch (error) {
//       console.error("Error approving ticket:", error);
//       res.status(500).json({ message: "Failed to approve ticket" });
//     }
//   }
// );

// // Reject a ticket
// app.patch(
//   "/api/admin/tickets/:id/reject",
//   verifyFirebaseToken,
//   requireRole("admin"),
//   async (req, res) => {
//     const { id } = req.params;

//     if (mongoose.connection.readyState !== 1) {
//       return res.status(503).json({ message: "Database not available" });
//     }

//     try {
//       const ticket = await Ticket.findByIdAndUpdate(
//         id,
//         { verified: "rejected", advertised: false },
//         { new: true }
//       );

//       if (!ticket) {
//         return res.status(404).json({ message: "Ticket not found" });
//       }

//       res.json({
//         message: "Ticket rejected",
//         ticket,
//       });
//     } catch (error) {
//       console.error("Error rejecting ticket:", error);
//       res.status(500).json({ message: "Failed to reject ticket" });
//     }
//   }
// );

// // Toggle advertisement
// app.patch(
//   "/api/admin/tickets/:id/advertise",
//   verifyFirebaseToken,
//   requireRole("admin"),
//   async (req, res) => {
//     const { id } = req.params;

//     if (mongoose.connection.readyState !== 1) {
//       return res.status(503).json({ message: "Database not available" });
//     }

//     try {
//       const ticket = await Ticket.findById(id);
//       if (!ticket) {
//         return res.status(404).json({ message: "Ticket not found" });
//       }

//       if (ticket.verified !== "approved") {
//         return res
//           .status(400)
//           .json({ message: "Only approved tickets can be advertised" });
//       }

//       // Check max advertised tickets
//       if (!ticket.advertised) {
//         const advertisedCount = await Ticket.countDocuments({
//           advertised: true,
//         });
//         if (advertisedCount >= 6) {
//           return res
//             .status(400)
//             .json({ message: "Maximum 6 tickets can be advertised" });
//         }
//       }

//       ticket.advertised = !ticket.advertised;
//       await ticket.save();

//       res.json({
//         message: ticket.advertised
//           ? "Ticket advertised"
//           : "Ticket removed from advertisement",
//         ticket,
//       });
//     } catch (error) {
//       console.error("Error toggling advertisement:", error);
//       res
//         .status(500)
//         .json({ message: "Failed to update advertisement status" });
//     }
//   }
// );

// // ---------- Error Handling Middleware ----------
// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err);
//   res.status(500).json({
//     message: "Internal server error",
//     error: process.env.NODE_ENV === "development" ? err.message : undefined,
//   });
// });

// // ---------- Start Server ----------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`🌐 Access: http://localhost:${PORT}`);
//   console.log(`📡 API Status: http://localhost:${PORT}/`);
//   console.log(`🎫 Advertised Tickets: http://localhost:${PORT}/api/advertised`);
// });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Fix Mongoose deprecation warning
mongoose.set('strictQuery', false);

// ---------- Firebase Admin ----------
const serviceAccountPath = path.join(
  __dirname,
  "ticketbari-projects-firebase-adminsdk-fbsvc-1d8b29239b.json"
);

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Firebase JSON file not found at:", serviceAccountPath);
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized");
} catch (error) {
  console.error("❌ Firebase Admin error:", error.message);
  process.exit(1);
}

// ---------- MongoDB Atlas Connection ----------
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://TICKETBARI-PROJECTS:MwcRwXSla0ahEjKj@cluster0.qj2eop5.mongodb.net/ticketbari?retryWrites=true&w=majority";

console.log("🔗 Connecting to MongoDB Atlas...");

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log("✅ MongoDB Atlas connected!");
  console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
  console.log("⚠️ Some features may not work");
});

// ---------- Mongoose Schemas ----------
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
  uid: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true },
  photoURL: String,
  role: { 
    type: String, 
    enum: ["user", "vendor", "admin"], 
    default: "user" 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ticket Schema
const ticketSchema = new Schema({
  title: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  transportType: { 
    type: String, 
    enum: ["bus", "train", "launch", "plane"],
    required: true 
  },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  perks: [String],
  image: { 
    type: String, 
    default: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500"
  },
  departureAt: { type: Date, required: true },
  arrivalAt: Date,
  vendorId: { type: String, required: true },
  vendorName: String,
  verified: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  advertised: { type: Boolean, default: false },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Booking Schema
const bookingSchema = new Schema({
  userId: { type: String, required: true },
  userName: String,
  userEmail: String,
  ticketId: { type: String, required: true },
  ticketTitle: String,
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending"
  },
  bookingDate: { type: Date, default: Date.now },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending"
  },
  paymentMethod: String,
  transactionId: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model("User", userSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);
const Booking = mongoose.model("Booking", bookingSchema);

// Create indexes (optional but recommended)
async function createIndexes() {
  try {
    await Ticket.createIndexes([
      { key: { verified: 1, advertised: 1 } },
      { key: { transportType: 1 } },
      { key: { from: 1, to: 1 } },
      { key: { price: 1 } },
      { key: { departureAt: 1 } }
    ]);
    await User.createIndex({ uid: 1 }, { unique: true });
    await Booking.createIndex({ userId: 1 });
    console.log("✅ Database indexes created");
  } catch (error) {
    console.log("⚠️ Could not create indexes:", error.message);
  }
}

// Run after connection
mongoose.connection.once('open', () => {
  createIndexes();
  
  // Insert sample data if database is empty
  insertSampleData();
});

async function insertSampleData() {
  try {
    const count = await Ticket.countDocuments();
    if (count === 0) {
      console.log("📝 Inserting sample tickets...");
      
      const sampleTickets = [
        {
          title: "Express Bus to Cox's Bazar",
          from: "Dhaka",
          to: "Cox's Bazar",
          transportType: "bus",
          price: 1200,
          quantity: 25,
          image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500",
          departureAt: new Date(Date.now() + 86400000 * 2), // 2 days from now
          vendorId: "vendor_001",
          vendorName: "Green Line Paribahan",
          verified: "approved",
          advertised: true,
          description: "AC Bus with comfortable seats, WiFi, and meal service"
        },
        {
          title: "Sundarban Tour Launch",
          from: "Khulna",
          to: "Sundarban",
          transportType: "launch",
          price: 2500,
          quantity: 15,
          image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500",
          departureAt: new Date(Date.now() + 86400000 * 3), // 3 days from now
          vendorId: "vendor_002",
          vendorName: "Sundarban Travels",
          verified: "approved",
          advertised: true,
          description: "Guided tour to Sundarban with lunch included"
        },
        {
          title: "Intercity Train to Sylhet",
          from: "Dhaka",
          to: "Sylhet",
          transportType: "train",
          price: 800,
          quantity: 50,
          image: "https://images.unsplash.com/photo-1516053256215-940222132676?w=500",
          departureAt: new Date(Date.now() + 86400000), // 1 day from now
          vendorId: "vendor_003",
          vendorName: "Bangladesh Railway",
          verified: "approved",
          advertised: true,
          description: "AC Chair Coach with punctual service"
        },
        {
          title: "Flight to Chittagong",
          from: "Dhaka",
          to: "Chittagong",
          transportType: "plane",
          price: 4500,
          quantity: 10,
          image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500",
          departureAt: new Date(Date.now() + 86400000 * 4), // 4 days from now
          vendorId: "vendor_004",
          vendorName: "Biman Bangladesh",
          verified: "approved",
          advertised: false,
          description: "Direct flight with in-flight meal"
        }
      ];
      
      await Ticket.insertMany(sampleTickets);
      console.log(`✅ Inserted ${sampleTickets.length} sample tickets`);
    }
  } catch (error) {
    console.log("⚠️ Could not insert sample data:", error.message);
  }
}

// ---------- Middleware ----------
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false,
      message: "Access denied. No token provided." 
    });
  }
  
  const idToken = authHeader.split("Bearer ")[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
    // Create or update user in database
    try {
      await User.findOneAndUpdate(
        { uid: decodedToken.uid },
        {
          uid: decodedToken.uid,
          name: decodedToken.name || "",
          email: decodedToken.email,
          photoURL: decodedToken.picture || "",
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.log("User sync error:", dbError.message);
    }
    
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
}

// ---------- Routes ----------

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "TicketBari Backend API",
    version: "1.0.0",
    status: "operational",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      advertised: "/api/advertised",
      tickets: "/api/tickets",
      ticketDetails: "/api/tickets/:id",
      myBookings: "/api/my-bookings (protected)",
      createBooking: "/api/bookings (protected)"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Public: Get advertised tickets
app.get("/api/advertised", async (req, res) => {
  try {
    const tickets = await Ticket.find({ 
      verified: "approved", 
      advertised: true,
      departureAt: { $gt: new Date() },
      quantity: { $gt: 0 }
    })
    .sort({ createdAt: -1 })
    .limit(6);
    
    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error("Error fetching advertised tickets:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch advertised tickets" 
    });
  }
});

// Public: Get all tickets with filters
app.get("/api/tickets", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 8, 
      transport, 
      from, 
      to, 
      sort = "departure_asc",
      minPrice,
      maxPrice
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build filter
    const filter = { 
      verified: "approved",
      departureAt: { $gt: new Date() },
      quantity: { $gt: 0 }
    };
    
    if (transport && ["bus", "train", "launch", "plane"].includes(transport)) {
      filter.transportType = transport;
    }
    
    if (from) filter.from = { $regex: from, $options: "i" };
    if (to) filter.to = { $regex: to, $options: "i" };
    if (minPrice) filter.price = { $gte: parseFloat(minPrice) };
    if (maxPrice) {
      filter.price = filter.price || {};
      filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Build sort
    let sortOption = {};
    switch(sort) {
      case "price_asc": sortOption = { price: 1 }; break;
      case "price_desc": sortOption = { price: -1 }; break;
      case "departure_asc": sortOption = { departureAt: 1 }; break;
      case "departure_desc": sortOption = { departureAt: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }
    
    // Execute query
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Ticket.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch tickets" 
    });
  }
});

// Public: Get single ticket
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: "Ticket not found" 
      });
    }
    
    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch ticket" 
    });
  }
});

// Protected: Get user's bookings
app.get("/api/my-bookings", verifyFirebaseToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.uid })
      .sort({ bookingDate: -1 });
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch bookings" 
    });
  }
});

// Protected: Create booking
app.post("/api/bookings", verifyFirebaseToken, async (req, res) => {
  try {
    const { ticketId, quantity } = req.body;
    
    if (!ticketId || !quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: "Ticket ID and quantity (min 1) are required" 
      });
    }
    
    // Get ticket
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: "Ticket not found" 
      });
    }
    
    if (ticket.quantity < quantity) {
      return res.status(400).json({ 
        success: false,
        message: `Only ${ticket.quantity} tickets available`
      });
    }
    
    if (new Date(ticket.departureAt) <= new Date()) {
      return res.status(400).json({ 
        success: false,
        message: "This ticket has already departed" 
      });
    }
    
    // Calculate total price
    const totalPrice = ticket.price * quantity;
    
    // Create booking
    const booking = new Booking({
      userId: req.user.uid,
      userName: req.user.name || req.user.email.split('@')[0],
      userEmail: req.user.email,
      ticketId,
      ticketTitle: ticket.title,
      quantity,
      totalPrice,
      status: "pending",
      paymentStatus: "pending"
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create booking" 
    });
  }
});

// Protected: Cancel booking
app.post("/api/bookings/:id/cancel", verifyFirebaseToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking not found" 
      });
    }
    
    if (booking.userId !== req.user.uid) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to cancel this booking" 
      });
    }
    
    if (booking.status === "cancelled") {
      return res.status(400).json({ 
        success: false,
        message: "Booking is already cancelled" 
      });
    }
    
    booking.status = "cancelled";
    booking.updatedAt = new Date();
    await booking.save();
    
    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to cancel booking" 
    });
  }
});

// ---------- Error Handling ----------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API Base: http://localhost:${PORT}`);
  console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  console.log(`🎫 Advertised Tickets: http://localhost:${PORT}/api/advertised`);
  console.log(`📋 All Tickets: http://localhost:${PORT}/api/tickets`);
});