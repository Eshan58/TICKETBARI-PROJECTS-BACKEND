
// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
// const admin = require("firebase-admin");

// const app = express();

// // ========== FIREBASE ADMIN INITIALIZATION ==========
// let firebaseInitialized = false;
// try {
//   // Method 1: Try to load service account from environment variable
//   if (process.env.FIREBASE_SERVICE_ACCOUNT) {
//     const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount)
//     });
//     firebaseInitialized = true;
//     console.log("✅ Firebase Admin SDK initialized from environment variable");
//   } 
//   // Method 2: Try to load from file
//   else if (require("fs").existsSync("./serviceAccountKey.json")) {
//     const serviceAccount = require("./serviceAccountKey.json");
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount)
//     });
//     firebaseInitialized = true;
//     console.log("✅ Firebase Admin SDK initialized from file");
//   } else {
//     console.log("⚠️ Firebase Admin SDK not initialized - running in mock mode");
//     console.log("   To enable real Firebase auth, add serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var");
//   }
// } catch (error) {
//   console.log("⚠️ Firebase Admin SDK initialization failed:", error.message);
//   console.log("   Running in mock authentication mode");
// }

// // Create mock Firebase admin for development
// if (!firebaseInitialized) {
//   global.firebaseAdminMock = {
//     auth: () => ({
//       verifyIdToken: async (idToken, checkRevoked = false) => {
//         console.log("🛠️ Mock Firebase token verification");
        
//         // Try to decode as JWT
//         if (idToken && idToken.includes('.') && idToken.split('.').length === 3) {
//           try {
//             const parts = idToken.split('.');
//             const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
//             const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            
//             console.log("✅ Mock decoded JWT:", {
//               alg: header.alg,
//               email: payload.email || payload.user_email,
//               uid: payload.user_id || payload.sub
//             });
            
//             return {
//               uid: payload.user_id || payload.sub || `mock-uid-${Date.now()}`,
//               email: payload.email || payload.user_email || 'user@example.com',
//               email_verified: true,
//               name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User')
//             };
//           } catch (e) {
//             console.log("⚠️ Could not decode as JWT in mock mode:", e.message);
//           }
//         }
        
//         // Fallback: treat token as email or generate mock user
//         let email = 'user@example.com';
//         if (idToken && idToken.includes('@')) {
//           email = idToken;
//         }
        
//         // Special case for admin email
//         const isAdminEmail = email === "mahdiashan9@gmail.com";
        
//         return {
//           uid: `mock-uid-${Date.now()}`,
//           email: email,
//           email_verified: true,
//           name: email.split('@')[0],
//           admin: isAdminEmail // Add admin flag for mock mode
//         };
//       }
//     })
//   };
// }

// // ========== MIDDLEWARE SETUP ==========
// app.use(
//   cors({
//     origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
//     credentials: true,
//   })
// );

// app.use(bodyParser.json());

// // Enhanced request logging middleware
// app.use((req, res, next) => {
//   const timestamp = new Date().toISOString();
//   console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
//   // Log auth header (truncated for security)
//   if (req.headers.authorization) {
//     const authHeader = req.headers.authorization;
//     const token = authHeader.replace('Bearer ', '');
//     console.log(`   Auth: ${authHeader.substring(0, 20)}... (${token.length} chars)`);
    
//     // Basic token validation
//     if (token) {
//       console.log(`   Token has dots: ${token.includes('.')}`);
//       console.log(`   Token dot count: ${(token.match(/\./g) || []).length}`);
//     }
//   }
  
//   next();
// });

// // ========== DATABASE CONNECTION ==========
// mongoose.set("strictQuery", false);
// const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ticketbari";

// console.log("🔗 Connecting to MongoDB...");

// mongoose
//   .connect(MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 5000,
//   })
//   .then(() => {
//     console.log("✅ MongoDB Connected Successfully");
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection failed:", err.message);
//     console.log("⚠️ Running without database...");
//   });

// // ========== MONGOOSE SCHEMAS & MODELS ==========
// const { Schema } = mongoose;

// // User Schema
// const userSchema = new Schema(
//   {
//     uid: { type: String, required: true, unique: true, index: true },
//     name: String,
//     email: { type: String, required: true, lowercase: true, trim: true, index: true },
//     photoURL: String,
//     role: {
//       type: String,
//       enum: ["user", "vendor", "admin"],
//       default: "user",
//       index: true,
//     },
//     emailVerified: { type: Boolean, default: false },
//     phoneNumber: String,
//     providerData: [{
//       providerId: String,
//       uid: String,
//       displayName: String,
//       email: String,
//       photoURL: String
//     }],
//     lastLogin: { type: Date, default: Date.now }
//   },
//   {
//     timestamps: true,
//   }
// );

// // Ticket Schema
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
//       default: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop",
//     },
//     departureAt: { type: Date, required: true, index: true },
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

// // Booking Schema
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
//     reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
//     reviewNotes: String,
//   },
//   {
//     timestamps: true,
//   }
// );

// // Models
// const User = mongoose.model("User", userSchema);
// const Ticket = mongoose.model("Ticket", ticketSchema);
// const Booking = mongoose.model("Booking", bookingSchema);
// const VendorApplication = mongoose.model("VendorApplication", vendorApplicationSchema);

// // ========== AUTHENTICATION MIDDLEWARE ==========
// async function firebaseAuthMiddleware(req, res, next) {
//   const authHeader = req.headers.authorization;

//   // Check if authorization header exists
//   if (!authHeader) {
//     console.log("🔴 No authorization header provided");
//     return res.status(401).json({
//       success: false,
//       message: "No authentication token provided",
//       code: "NO_TOKEN"
//     });
//   }

//   // Check if it's a Bearer token
//   if (!authHeader.startsWith("Bearer ")) {
//     console.log("🔴 Invalid authorization format. Expected 'Bearer <token>'");
//     return res.status(401).json({
//       success: false,
//       message: "Invalid authorization format. Expected 'Bearer <token>'",
//       code: "INVALID_FORMAT"
//     });
//   }

//   const idToken = authHeader.split("Bearer ")[1];
  
//   // Validate token exists
//   if (!idToken || idToken.trim() === "") {
//     console.log("🔴 Empty token provided");
//     return res.status(401).json({
//       success: false,
//       message: "Empty token provided",
//       code: "EMPTY_TOKEN"
//     });
//   }

//   console.log(`🔑 Token received: ${idToken.length} characters`);
  
//   // Basic token validation
//   if (idToken.length < 50) {
//     console.log("❌ Token too short (likely invalid)");
//     return res.status(401).json({
//       success: false,
//       message: "Invalid token format",
//       code: "TOKEN_TOO_SHORT"
//     });
//   }

//   try {
//     let decodedToken;
//     let authMethod = "unknown";
    
//     // Try Firebase Admin verification if initialized
//     if (firebaseInitialized && admin.apps.length > 0) {
//       authMethod = "firebase_admin";
//       try {
//         decodedToken = await admin.auth().verifyIdToken(idToken);
//         console.log(`✅ Firebase Admin verification successful for: ${decodedToken.email}`);
//       } catch (firebaseError) {
//         console.log(`❌ Firebase Admin verification failed: ${firebaseError.code} - ${firebaseError.message}`);
        
//         // Handle specific Firebase errors
//         if (firebaseError.code === 'auth/id-token-expired') {
//           return res.status(401).json({
//             success: false,
//             message: "Token expired. Please login again.",
//             code: "TOKEN_EXPIRED"
//           });
//         }
        
//         if (firebaseError.code === 'auth/argument-error') {
//           console.log("⚠️ Token argument error - trying JWT decode...");
//           authMethod = "jwt_decode";
//         } else {
//           throw firebaseError;
//         }
//       }
//     }
    
//     // If Firebase failed or not initialized, try to decode as JWT
//     if (!decodedToken && authMethod === "jwt_decode") {
//       try {
//         // Check if it looks like a JWT
//         if (idToken.includes('.') && idToken.split('.').length === 3) {
//           const parts = idToken.split('.');
          
//           // Decode header
//           const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
//           const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
//           console.log(`✅ JWT decoded successfully: ${payload.email || 'no email'}`);
          
//           decodedToken = {
//             uid: payload.user_id || payload.sub || `jwt-uid-${Date.now()}`,
//             email: payload.email || payload.user_email || 'user@example.com',
//             email_verified: payload.email_verified || true,
//             name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User'),
//             picture: payload.picture,
//             iss: payload.iss,
//             aud: payload.aud,
//             iat: payload.iat,
//             exp: payload.exp
//           };
          
//           authMethod = "jwt_decode";
//         }
//       } catch (decodeError) {
//         console.log(`❌ JWT decode failed: ${decodeError.message}`);
//         authMethod = "mock";
//       }
//     }
    
//     // Fallback to mock verification
//     if (!decodedToken) {
//       authMethod = "mock";
//       console.log("🛠️ Using mock authentication");
      
//       // Try to extract email from token if possible
//       let email = 'user@example.com';
//       if (idToken.includes('@')) {
//         email = idToken;
//       }
      
//       decodedToken = {
//         uid: `mock-uid-${Date.now()}`,
//         email: email,
//         email_verified: true,
//         name: email.split('@')[0],
//         auth_method: 'mock'
//       };
//     }
    
//     console.log(`✅ Authentication successful via ${authMethod}: ${decodedToken.email}`);
    
//     // Find or create user in database
//     let user = await User.findOne({ uid: decodedToken.uid });
    
//     if (!user) {
//       console.log(`👤 Creating new user: ${decodedToken.email}`);
      
//       // Set role based on email - IMPORTANT: This makes mahdiashan9@gmail.com admin
//       let role = "user";
//       if (decodedToken.email === "mahdiashan9@gmail.com") {
//         role = "admin";
//         console.log(`⭐ Setting ${decodedToken.email} as admin`);
//       }
      
//       user = new User({
//         uid: decodedToken.uid,
//         email: decodedToken.email,
//         name: decodedToken.name || decodedToken.email.split('@')[0],
//         photoURL: decodedToken.picture || decodedToken.photoURL,
//         emailVerified: decodedToken.email_verified || false,
//         role: role, // This sets the admin role for specific email
//         lastLogin: new Date()
//       });
      
//       await user.save();
//       console.log(`✅ User created: ${user.email} (${user.role})`);
//     } else {
//       console.log(`✅ User found: ${user.email} (${user.role})`);
      
//       // Update last login
//       user.lastLogin = new Date();
      
//       // Special case: If user is mahdiashan9@gmail.com and not admin, update to admin
//       if (user.email === "mahdiashan9@gmail.com" && user.role !== "admin") {
//         console.log(`⭐ Upgrading ${user.email} to admin role`);
//         user.role = "admin";
//       }
      
//       await user.save();
//     }
    
//     // Attach user to request
//     req.user = decodedToken;
//     req.mongoUser = user;
//     req.authMethod = authMethod;
    
//     next();
//   } catch (error) {
//     console.error("🔴 Authentication error:", error.message);
//     console.error(error.stack);
    
//     res.status(401).json({
//       success: false,
//       message: "Authentication failed",
//       code: "AUTH_FAILED",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined
//     });
//   }
// }

// /**
//  * Role-based authorization middleware
//  */
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
//         message: `Access denied. Required role: ${roles.join(", ")}. Your role: ${req.mongoUser.role}`,
//       });
//     }

//     next();
//   };
// };

// // ========== PUBLIC ROUTES ==========
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "🎫 TicketBari API is running!",
//     version: "2.0.1",
//     timestamp: new Date().toISOString(),
//     features: {
//       authentication: firebaseInitialized ? "Firebase + MongoDB" : "Mock + MongoDB",
//       database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
//       endpoints: ["/api/health", "/api/tickets", "/api/advertised", "/api/user/profile"]
//     },
//     adminEmail: "mahdiashan9@gmail.com"
//   });
// });

// // Health check endpoint
// app.get("/api/health", async (req, res) => {
//   const health = {
//     success: true,
//     status: "healthy",
//     timestamp: new Date().toISOString(),
//     services: {
//       database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
//       firebase: firebaseInitialized ? "initialized" : "mock_mode",
//       uptime: process.uptime(),
//     },
//     memory: {
//       rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
//       heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
//       heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
//     }
//   };
//   res.json(health);
// });

// // Public tickets endpoint
// app.get("/api/tickets", async (req, res) => {
//   try {
//     const { limit = 12, page = 1, type, from, to } = req.query;
    
//     let filter = { 
//       verified: "approved", 
//       isActive: true,
//       departureAt: { $gt: new Date() }
//     };
    
//     if (type) filter.transportType = type;
//     if (from) filter.from = new RegExp(from, "i");
//     if (to) filter.to = new RegExp(to, "i");

//     const pageNum = Math.max(1, parseInt(page));
//     const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
//     const skip = (pageNum - 1) * limitNum;

//     let tickets = [];
//     let total = 0;

//     if (mongoose.connection.readyState === 1) {
//       tickets = await Ticket.find(filter)
//         .sort({ departureAt: 1, createdAt: -1 })
//         .skip(skip)
//         .limit(limitNum);

//       total = await Ticket.countDocuments(filter);
//     } else {
//       // Mock data when DB is not connected
//       tickets = [
//         {
//           _id: "sample-1",
//           title: "Dhaka to Chittagong AC Bus",
//           from: "Dhaka",
//           to: "Chittagong",
//           transportType: "bus",
//           price: 1200,
//           quantity: 40,
//           availableQuantity: 25,
//           image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500",
//           vendorName: "Travel Express",
//           verified: "approved",
//           isActive: true,
//           departureAt: new Date(Date.now() + 86400000),
//           createdAt: new Date(),
//           perks: ["AC", "WiFi", "Water"]
//         }
//       ].slice(skip, skip + limitNum);
      
//       total = 2;
//     }

//     res.json({
//       success: true,
//       data: {
//         tickets,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total,
//           pages: Math.ceil(total / limitNum),
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching tickets:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching tickets",
//     });
//   }
// });

// // Advertised tickets endpoint
// app.get("/api/advertised", async (req, res) => {
//   try {
//     let tickets = [];

//     if (mongoose.connection.readyState === 1) {
//       tickets = await Ticket.find({ 
//         advertised: true, 
//         verified: "approved", 
//         isActive: true,
//         departureAt: { $gt: new Date() }
//       })
//       .sort({ createdAt: -1 })
//       .limit(6);
//     } else {
//       // Mock advertised tickets
//       tickets = [
//         {
//           _id: "advertised-1",
//           title: "Premium Dhaka to Cox's Bazar Bus",
//           from: "Dhaka",
//           to: "Cox's Bazar",
//           transportType: "bus",
//           price: 2500,
//           quantity: 30,
//           availableQuantity: 15,
//           image: "https://images.unsplash.com/photo-1596394516093-9baa1d3d7f4c?w=500",
//           advertised: true,
//           verified: "approved",
//           isActive: true,
//           departureAt: new Date(Date.now() + 259200000),
//           perks: ["Luxury", "AC", "TV", "Snacks"]
//         }
//       ];
//     }

//     res.json({
//       success: true,
//       data: {
//         tickets,
//         count: tickets.length
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching advertised tickets:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching advertised tickets",
//     });
//   }
// });

// // Get single ticket by ID
// app.get("/api/tickets/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     let ticket = null;
    
//     if (mongoose.connection.readyState === 1) {
//       ticket = await Ticket.findById(id);
//     } else {
//       // Mock ticket
//       ticket = {
//         _id: id,
//         title: "Sample Ticket",
//         from: "Dhaka",
//         to: "Chittagong",
//         transportType: "bus",
//         price: 1200,
//         quantity: 40,
//         availableQuantity: 25,
//         image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500",
//         vendorName: "Travel Express",
//         verified: "approved",
//         isActive: true,
//         departureAt: new Date(Date.now() + 86400000),
//         description: "A comfortable AC bus journey from Dhaka to Chittagong.",
//         perks: ["AC", "WiFi", "Water", "Snacks"]
//       };
//     }
    
//     if (!ticket) {
//       return res.status(404).json({
//         success: false,
//         message: "Ticket not found"
//       });
//     }
    
//     res.json({
//       success: true,
//       data: { ticket }
//     });
//   } catch (error) {
//     console.error("Error fetching ticket:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching ticket",
//     });
//   }
// });

// // ========== USER ROUTES ==========
// // User profile endpoint - uses Firebase auth
// app.get("/api/user/profile", firebaseAuthMiddleware, async (req, res) => {
//   try {
//     console.log(`📋 Returning profile for: ${req.mongoUser.email} (via ${req.authMethod})`);
    
//     res.json({
//       success: true,
//       data: { 
//         user: {
//           _id: req.mongoUser._id,
//           uid: req.mongoUser.uid,
//           name: req.mongoUser.name,
//           email: req.mongoUser.email,
//           photoURL: req.mongoUser.photoURL,
//           role: req.mongoUser.role,
//           emailVerified: req.mongoUser.emailVerified,
//           createdAt: req.mongoUser.createdAt,
//           updatedAt: req.mongoUser.updatedAt,
//           lastLogin: req.mongoUser.lastLogin
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching profile:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching profile",
//     });
//   }
// });

// // ========== DEBUG & UTILITY ROUTES ==========
// // Token debugging endpoint
// app.post("/api/debug/token-check", async (req, res) => {
//   try {
//     const { token } = req.body;
    
//     if (!token) {
//       return res.status(400).json({
//         success: false,
//         message: "No token provided"
//       });
//     }
    
//     const analysis = {
//       tokenInfo: {
//         length: token.length,
//         type: typeof token,
//         first50: token.substring(0, 50),
//         last50: token.substring(Math.max(0, token.length - 50)),
//         hasDots: token.includes('.'),
//         dotCount: (token.match(/\./g) || []).length
//       },
//       isValidJWT: false,
//       decoded: null
//     };
    
//     // Try to decode as JWT
//     if (token.includes('.') && token.split('.').length === 3) {
//       try {
//         const parts = token.split('.');
//         const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
//         const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
//         analysis.isValidJWT = true;
//         analysis.decoded = {
//           header,
//           payload: {
//             ...payload,
//             exp_date: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
//             iat_date: payload.iat ? new Date(payload.iat * 1000).toISOString() : null
//           }
//         };
//       } catch (decodeError) {
//         analysis.decodeError = decodeError.message;
//       }
//     }
    
//     res.json({
//       success: true,
//       data: analysis
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // Debug auth check endpoint
// app.get("/api/debug/auth-check", firebaseAuthMiddleware, async (req, res) => {
//   try {
//     res.json({
//       success: true,
//       data: {
//         authenticated: true,
//         user: {
//           firebase: req.user,
//           mongo: {
//             _id: req.mongoUser._id,
//             email: req.mongoUser.email,
//             role: req.mongoUser.role,
//             uid: req.mongoUser.uid
//           },
//           authMethod: req.authMethod
//         },
//         headers: {
//           authorization: req.headers.authorization ? "Present" : "Missing"
//         },
//         isAdmin: req.mongoUser.role === "admin",
//         adminEmailCheck: req.mongoUser.email === "mahdiashan9@gmail.com"
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // Force make admin endpoint
// app.post("/api/debug/make-me-admin", firebaseAuthMiddleware, async (req, res) => {
//   try {
//     if (mongoose.connection.readyState === 1) {
//       const updatedUser = await User.findOneAndUpdate(
//         { email: req.mongoUser.email },
//         { role: "admin" },
//         { new: true }
//       );
      
//       res.json({
//         success: true,
//         message: `Made ${req.mongoUser.email} an admin`,
//         data: { user: updatedUser }
//       });
//     } else {
//       res.json({
//         success: true,
//         message: "Mock: Would make you admin if DB connected"
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // List all users (debug)
// app.get("/api/debug/users", async (req, res) => {
//   try {
//     let users = [];
//     if (mongoose.connection.readyState === 1) {
//       users = await User.find().sort({ createdAt: -1 }).limit(50);
//     }
    
//     res.json({
//       success: true,
//       data: {
//         users: users.map(user => ({
//           _id: user._id,
//           uid: user.uid,
//           email: user.email,
//           name: user.name,
//           role: user.role,
//           createdAt: user.createdAt,
//           lastLogin: user.lastLogin
//         })),
//         count: users.length,
//         dbConnected: mongoose.connection.readyState === 1
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Debug tickets endpoint
// app.get("/api/debug/tickets", async (req, res) => {
//   try {
//     let allTickets = [];
//     let stats = {};

//     if (mongoose.connection.readyState === 1) {
//       allTickets = await Ticket.find().sort({ createdAt: -1 }).limit(50);
      
//       const counts = await Ticket.aggregate([
//         { $group: { _id: "$verified", count: { $sum: 1 } } }
//       ]);
      
//       stats = {
//         totalTickets: await Ticket.countDocuments(),
//         approvedTickets: counts.find(c => c._id === "approved")?.count || 0,
//         pendingTickets: counts.find(c => c._id === "pending")?.count || 0,
//         rejectedTickets: counts.find(c => c._id === "rejected")?.count || 0,
//         activeTickets: await Ticket.countDocuments({ isActive: true }),
//         futureTickets: await Ticket.countDocuments({ departureAt: { $gt: new Date() } }),
//         advertisedTickets: await Ticket.countDocuments({ advertised: true }),
//         approvedActive: await Ticket.countDocuments({ 
//           verified: "approved", 
//           isActive: true,
//           departureAt: { $gt: new Date() }
//         })
//       };
//     } else {
//       allTickets = [];
//       stats = {
//         totalTickets: 0,
//         approvedTickets: 0,
//         pendingTickets: 0,
//         rejectedTickets: 0,
//         activeTickets: 0,
//         futureTickets: 0,
//         advertisedTickets: 0,
//         approvedActive: 0
//       };
//     }

//     res.json({
//       success: true,
//       data: {
//         allTickets,
//         stats,
//         dbConnected: mongoose.connection.readyState === 1
//       }
//     });
//   } catch (error) {
//     console.error("Debug error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Approve all tickets (debug utility)
// app.post("/api/debug/approve-all", async (req, res) => {
//   try {
//     if (mongoose.connection.readyState === 1) {
//       const result = await Ticket.updateMany(
//         {},
//         { verified: "approved", isActive: true }
//       );
//       res.json({
//         success: true,
//         message: `Approved ${result.modifiedCount} tickets`,
//         data: result
//       });
//     } else {
//       res.json({
//         success: true,
//         message: "Mock: All tickets approved (DB not connected)"
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Create sample tickets (debug)
// app.post("/api/debug/create-sample-tickets", async (req, res) => {
//   try {
//     if (mongoose.connection.readyState === 1) {
//       const sampleTickets = [
//         {
//           title: "Dhaka to Chittagong Express",
//           from: "Dhaka",
//           to: "Chittagong",
//           transportType: "bus",
//           price: 1200,
//           quantity: 40,
//           vendorId: "vendor-001",
//           vendorName: "Green Line",
//           verified: "approved",
//           advertised: true,
//           departureAt: new Date(Date.now() + 86400000),
//           description: "Premium AC bus service"
//         },
//         {
//           title: "Dhaka to Sylhet Train",
//           from: "Dhaka",
//           to: "Sylhet",
//           transportType: "train",
//           price: 1800,
//           quantity: 100,
//           vendorId: "vendor-002",
//           vendorName: "Bangladesh Railway",
//           verified: "approved",
//           advertised: false,
//           departureAt: new Date(Date.now() + 172800000),
//           description: "Intercity train service"
//         }
//       ];
      
//       const createdTickets = await Ticket.insertMany(sampleTickets);
      
//       res.json({
//         success: true,
//         message: `Created ${createdTickets.length} sample tickets`,
//         data: createdTickets
//       });
//     } else {
//       res.json({
//         success: true,
//         message: "Cannot create tickets - DB not connected"
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// // Test admin access
// app.get("/api/debug/test-admin", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
//   res.json({
//     success: true,
//     message: "Admin access confirmed!",
//     data: {
//       user: req.mongoUser.email,
//       role: req.mongoUser.role,
//       isAdmin: true
//     }
//   });
// });

// // ========== ADMIN ROUTES ==========
// // Admin dashboard
// app.get("/api/admin/dashboard", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
//   try {
//     console.log(`📊 Admin dashboard accessed by: ${req.mongoUser.email} (${req.mongoUser.role})`);
    
//     let totalUsers = 0;
//     let totalTickets = 0;
//     let totalBookings = 0;
//     let pendingTickets = 0;
//     let pendingVendorApplications = 0;
//     let totalVendors = 0;

//     if (mongoose.connection.readyState === 1) {
//       [
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
//     } else {
//       // Mock data
//       totalUsers = 156;
//       totalTickets = 342;
//       totalBookings = 128;
//       pendingTickets = 12;
//       pendingVendorApplications = 5;
//       totalVendors = 24;
//     }

//     res.json({
//       success: true,
//       data: {
//         stats: {
//           users: totalUsers,
//           tickets: totalTickets,
//           bookings: totalBookings,
//           pendingApprovals: pendingTickets,
//           pendingVendorApplications,
//           vendors: totalVendors,
//           revenue: 12500,
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error in admin dashboard:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching dashboard data",
//     });
//   }
// });

// // Admin users management
// app.get("/api/admin/users", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
//   try {
//     const { role = "all", search = "", page = 1, limit = 20 } = req.query;
    
//     let filter = {};
//     if (role !== "all") filter.role = role;
//     if (search) {
//       filter.$or = [
//         { name: new RegExp(search, "i") },
//         { email: new RegExp(search, "i") },
//       ];
//     }

//     const pageNum = Math.max(1, parseInt(page));
//     const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
//     const skip = (pageNum - 1) * limitNum;

//     let users = [];
//     let total = 0;
//     let roleCounts = { total: 0, admins: 0, vendors: 0, regularUsers: 0 };

//     if (mongoose.connection.readyState === 1) {
//       users = await User.find(filter)
//         .select("-__v")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limitNum);

//       total = await User.countDocuments(filter);

//       // Get role counts
//       const counts = await User.aggregate([
//         { $group: { _id: "$role", count: { $sum: 1 } } }
//       ]);

//       roleCounts.total = total;
//       roleCounts.admins = counts.find(c => c._id === "admin")?.count || 0;
//       roleCounts.vendors = counts.find(c => c._id === "vendor")?.count || 0;
//       roleCounts.regularUsers = counts.find(c => c._id === "user")?.count || 0;
//     } else {
//       // Mock data
//       users = [
//         {
//           _id: "1",
//           uid: "test-admin-id",
//           name: "Ashan Mahdi",
//           email: "mahdiashan9@gmail.com",
//           photoURL: "https://ui-avatars.com/api/?name=Ashan+Mahdi&background=random",
//           role: "admin",
//           createdAt: new Date().toISOString(),
//           updatedAt: new Date().toISOString(),
//         }
//       ].filter(user => {
//         if (role !== "all" && user.role !== role) return false;
//         if (search) {
//           const searchLower = search.toLowerCase();
//           return (
//             user.name?.toLowerCase().includes(searchLower) ||
//             user.email?.toLowerCase().includes(searchLower)
//           );
//         }
//         return true;
//       });

//       total = users.length;
//       roleCounts = {
//         total: 156,
//         admins: 3,
//         vendors: 24,
//         regularUsers: 129,
//       };
//     }

//     res.json({
//       success: true,
//       data: {
//         users,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total,
//           pages: Math.ceil(total / limitNum),
//         },
//         stats: roleCounts,
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching users",
//     });
//   }
// });

// // Update user role
// app.put("/api/admin/users/:id/role", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
//   try {
//     const { role } = req.body;
    
//     if (!["user", "vendor", "admin"].includes(role)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid role",
//       });
//     }

//     if (mongoose.connection.readyState === 1) {
//       const user = await User.findByIdAndUpdate(
//         req.params.id,
//         { role },
//         { new: true }
//       );

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: "User not found",
//         });
//       }

//       res.json({
//         success: true,
//         message: `User role updated to ${role}`,
//         data: { user },
//       });
//     } else {
//       // Mock response
//       res.json({
//         success: true,
//         message: `User role updated to ${role} (mock)`,
//         data: {
//           user: {
//             _id: req.params.id,
//             role: role,
//             name: "Mock User",
//             email: "mock@example.com",
//           }
//         }
//       });
//     }
//   } catch (error) {
//     console.error("Error updating role:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating user role",
//     });
//   }
// });

// // Admin tickets management
// app.get("/api/admin/tickets", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
//   try {
//     const { verified = "all", page = 1, limit = 10 } = req.query;
    
//     let filter = {};
//     if (verified !== "all") filter.verified = verified;

//     const pageNum = Math.max(1, parseInt(page));
//     const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
//     const skip = (pageNum - 1) * limitNum;

//     let tickets = [];
//     let total = 0;
//     let stats = { total: 0, pending: 0, approved: 0, rejected: 0 };

//     if (mongoose.connection.readyState === 1) {
//       tickets = await Ticket.find(filter)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limitNum);

//       total = await Ticket.countDocuments(filter);

//       // Get status counts
//       const counts = await Ticket.aggregate([
//         { $group: { _id: "$verified", count: { $sum: 1 } } }
//       ]);

//       stats.total = total;
//       stats.pending = counts.find(c => c._id === "pending")?.count || 0;
//       stats.approved = counts.find(c => c._id === "approved")?.count || 0;
//       stats.rejected = counts.find(c => c._id === "rejected")?.count || 0;
//     } else {
//       // Mock data
//       tickets = [
//         {
//           _id: "1",
//           title: "Dhaka to Chittagong",
//           from: "Dhaka",
//           to: "Chittagong",
//           transportType: "bus",
//           price: 1200,
//           quantity: 40,
//           availableQuantity: 25,
//           vendorId: "vendor1",
//           vendorName: "Travel Express",
//           verified: "approved",
//           isActive: true,
//           departureAt: new Date().toISOString(),
//           createdAt: new Date().toISOString(),
//         }
//       ].filter(ticket => verified === "all" || ticket.verified === verified);

//       total = tickets.length;
//       stats = {
//         total: 342,
//         pending: 12,
//         approved: 325,
//         rejected: 5,
//       };
//     }

//     res.json({
//       success: true,
//       data: {
//         tickets,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total,
//           pages: Math.ceil(total / limitNum),
//         },
//         stats,
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching tickets:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching tickets",
//     });
//   }
// });

// // Verify/Reject ticket
// app.put("/api/admin/tickets/:id/verify", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!["approved", "rejected"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status",
//       });
//     }

//     if (mongoose.connection.readyState === 1) {
//       const ticket = await Ticket.findByIdAndUpdate(
//         req.params.id,
//         { 
//           verified: status,
//           isActive: status === "approved"
//         },
//         { new: true }
//       );

//       if (!ticket) {
//         return res.status(404).json({
//           success: false,
//           message: "Ticket not found",
//         });
//       }

//       res.json({
//         success: true,
//         message: `Ticket ${status} successfully`,
//         data: { ticket },
//       });
//     } else {
//       // Mock response
//       res.json({
//         success: true,
//         message: `Ticket ${status} successfully (mock)`,
//         data: {
//           ticket: {
//             _id: req.params.id,
//             verified: status,
//             isActive: status === "approved",
//             title: "Mock Ticket",
//           }
//         }
//       });
//     }
//   } catch (error) {
//     console.error("Error verifying ticket:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating ticket",
//     });
//   }
// });

// // Admin vendor applications
// app.get("/api/admin/vendor-applications", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
//   try {
//     const { status = "all", page = 1, limit = 10 } = req.query;
    
//     let filter = {};
//     if (status !== "all") filter.status = status;

//     const pageNum = Math.max(1, parseInt(page));
//     const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
//     const skip = (pageNum - 1) * limitNum;

//     let applications = [];
//     let total = 0;
//     let stats = { total: 0, pending: 0, approved: 0, rejected: 0 };

//     if (mongoose.connection.readyState === 1) {
//       applications = await VendorApplication.find(filter)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limitNum);

//       total = await VendorApplication.countDocuments(filter);

//       // Get status counts
//       const counts = await VendorApplication.aggregate([
//         { $group: { _id: "$status", count: { $sum: 1 } } }
//       ]);

//       stats.total = total;
//       stats.pending = counts.find(c => c._id === "pending")?.count || 0;
//       stats.approved = counts.find(c => c._id === "approved")?.count || 0;
//       stats.rejected = counts.find(c => c._id === "rejected")?.count || 0;
//     } else {
//       // Mock data
//       applications = [
//         {
//           _id: "1",
//           userId: "user4",
//           userName: "Bob Wilson",
//           userEmail: "bob@example.com",
//           businessName: "Wilson Travels",
//           contactName: "Bob Wilson",
//           phone: "+8801712345678",
//           businessType: "Travel Agency",
//           description: "Premium travel services",
//           address: "123 Main St, Dhaka",
//           status: "pending",
//           createdAt: new Date().toISOString(),
//         }
//       ].filter(app => status === "all" || app.status === status);

//       total = applications.length;
//       stats = {
//         total: 8,
//         pending: 5,
//         approved: 2,
//         rejected: 1,
//       };
//     }

//     res.json({
//       success: true,
//       data: {
//         applications,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total,
//           pages: Math.ceil(total / limitNum),
//         },
//         stats,
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching vendor applications:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching applications",
//     });
//   }
// });

// // ========== ERROR HANDLERS ==========
// // 404 handler for undefined routes
// app.use((req, res) => {
//   console.log(`🔍 404: ${req.method} ${req.url}`);
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.method} ${req.url}`,
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error("🔥 Server Error:", err.message);
//   console.error(err.stack);

//   res.status(500).json({
//     success: false,
//     message: "Internal server error",
//     error: process.env.NODE_ENV === "development" ? err.message : undefined,
//   });
// });

// // ========== START SERVER ==========
// const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () => {
//   console.log("=".repeat(70));
//   console.log("🚀 TICKETBARI BACKEND SERVER STARTED");
//   console.log("=".repeat(70));
//   console.log(`📡 Server URL: http://localhost:${PORT}`);
//   console.log(`🔐 Auth Mode: ${firebaseInitialized ? "Firebase Admin" : "Mock Authentication"}`);
//   console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`);
//   console.log(`👑 Admin Email: mahdiashan9@gmail.com`);
//   console.log("=".repeat(70));
//   console.log("📋 IMPORTANT DEBUG ENDPOINTS:");
//   console.log("   GET  /api/debug/users           - List all users in database");
//   console.log("   GET  /api/debug/auth-check      - Check authentication status");
//   console.log("   POST /api/debug/make-me-admin   - Force make user admin");
//   console.log("   GET  /api/debug/test-admin      - Test admin access");
//   console.log("   POST /api/debug/token-check     - Analyze token");
//   console.log("=".repeat(70));
//   console.log("🔧 TROUBLESHOOTING STEPS:");
//   console.log("   1. Clear browser storage and logout/login");
//   console.log("   2. Visit /debug-auth in frontend");
//   console.log("   3. Check /api/debug/users to see user roles");
//   console.log("   4. Use /api/debug/make-me-admin if not admin");
//   console.log("=".repeat(70));
// });
// server.js - COMPLETE FIXED VERSION
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();

// ========== FIREBASE ADMIN INITIALIZATION ==========
let firebaseInitialized = false;
try {
  // Method 1: Try to load service account from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin SDK initialized from environment variable");
  } 
  // Method 2: Try to load from file
  else if (require("fs").existsSync("./serviceAccountKey.json")) {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin SDK initialized from file");
  } else {
    console.log("⚠️ Firebase Admin SDK not initialized - running in mock mode");
    console.log("   To enable real Firebase auth, add serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var");
  }
} catch (error) {
  console.log("⚠️ Firebase Admin SDK initialization failed:", error.message);
  console.log("   Running in mock authentication mode");
}

// Create mock Firebase admin for development
if (!firebaseInitialized) {
  global.firebaseAdminMock = {
    auth: () => ({
      verifyIdToken: async (idToken, checkRevoked = false) => {
        console.log("🛠️ Mock Firebase token verification");
        
        // Try to decode as JWT
        if (idToken && idToken.includes('.') && idToken.split('.').length === 3) {
          try {
            const parts = idToken.split('.');
            const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            
            console.log("✅ Mock decoded JWT:", {
              alg: header.alg,
              email: payload.email || payload.user_email,
              uid: payload.user_id || payload.sub
            });
            
            return {
              uid: payload.user_id || payload.sub || `mock-uid-${Date.now()}`,
              email: payload.email || payload.user_email || 'user@example.com',
              email_verified: true,
              name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User')
            };
          } catch (e) {
            console.log("⚠️ Could not decode as JWT in mock mode:", e.message);
          }
        }
        
        // Fallback: treat token as email or generate mock user
        let email = 'user@example.com';
        if (idToken && idToken.includes('@')) {
          email = idToken;
        }
        
        // Special case for admin email
        const isAdminEmail = email === "mahdiashan9@gmail.com";
        
        return {
          uid: `mock-uid-${Date.now()}`,
          email: email,
          email_verified: true,
          name: email.split('@')[0],
          admin: isAdminEmail // Add admin flag for mock mode
        };
      }
    })
  };
}

// ========== MIDDLEWARE SETUP ==========
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(bodyParser.json());

// Enhanced request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Log auth header (truncated for security)
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    const token = authHeader.replace('Bearer ', '');
    console.log(`   Auth: ${authHeader.substring(0, 20)}... (${token.length} chars)`);
    
    // Basic token validation
    if (token) {
      console.log(`   Token has dots: ${token.includes('.')}`);
      console.log(`   Token dot count: ${(token.match(/\./g) || []).length}`);
    }
  }
  
  next();
});

// ========== DATABASE CONNECTION ==========
mongoose.set("strictQuery", false);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ticketbari";

console.log("🔗 Connecting to MongoDB...");

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️ Running without database...");
  });

// ========== MONGOOSE SCHEMAS & MODELS ==========
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: String,
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    photoURL: String,
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    phoneNumber: String,
    providerData: [{
      providerId: String,
      uid: String,
      displayName: String,
      email: String,
      photoURL: String
    }],
    lastLogin: { type: Date, default: Date.now }
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
      default: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop",
    },
    departureAt: { type: Date, required: true, index: true },
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

// ========== AUTHENTICATION MIDDLEWARE ==========
async function firebaseAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if authorization header exists
  if (!authHeader) {
    console.log("🔴 No authorization header provided");
    return res.status(401).json({
      success: false,
      message: "No authentication token provided",
      code: "NO_TOKEN"
    });
  }

  // Check if it's a Bearer token
  if (!authHeader.startsWith("Bearer ")) {
    console.log("🔴 Invalid authorization format. Expected 'Bearer <token>'");
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format. Expected 'Bearer <token>'",
      code: "INVALID_FORMAT"
    });
  }

  const idToken = authHeader.split("Bearer ")[1];
  
  // Validate token exists
  if (!idToken || idToken.trim() === "") {
    console.log("🔴 Empty token provided");
    return res.status(401).json({
      success: false,
      message: "Empty token provided",
      code: "EMPTY_TOKEN"
    });
  }

  console.log(`🔑 Token received: ${idToken.length} characters`);
  
  // Basic token validation
  if (idToken.length < 50) {
    console.log("❌ Token too short (likely invalid)");
    return res.status(401).json({
      success: false,
      message: "Invalid token format",
      code: "TOKEN_TOO_SHORT"
    });
  }

  try {
    let decodedToken;
    let authMethod = "unknown";
    
    // Try Firebase Admin verification if initialized
    if (firebaseInitialized && admin.apps.length > 0) {
      authMethod = "firebase_admin";
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log(`✅ Firebase Admin verification successful for: ${decodedToken.email}`);
      } catch (firebaseError) {
        console.log(`❌ Firebase Admin verification failed: ${firebaseError.code} - ${firebaseError.message}`);
        
        // Handle specific Firebase errors
        if (firebaseError.code === 'auth/id-token-expired') {
          return res.status(401).json({
            success: false,
            message: "Token expired. Please login again.",
            code: "TOKEN_EXPIRED"
          });
        }
        
        if (firebaseError.code === 'auth/argument-error') {
          console.log("⚠️ Token argument error - trying JWT decode...");
          authMethod = "jwt_decode";
        } else {
          throw firebaseError;
        }
      }
    }
    
    // If Firebase failed or not initialized, try to decode as JWT
    if (!decodedToken && authMethod === "jwt_decode") {
      try {
        // Check if it looks like a JWT
        if (idToken.includes('.') && idToken.split('.').length === 3) {
          const parts = idToken.split('.');
          
          // Decode header
          const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          console.log(`✅ JWT decoded successfully: ${payload.email || 'no email'}`);
          
          decodedToken = {
            uid: payload.user_id || payload.sub || `jwt-uid-${Date.now()}`,
            email: payload.email || payload.user_email || 'user@example.com',
            email_verified: payload.email_verified || true,
            name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User'),
            picture: payload.picture,
            iss: payload.iss,
            aud: payload.aud,
            iat: payload.iat,
            exp: payload.exp
          };
          
          authMethod = "jwt_decode";
        }
      } catch (decodeError) {
        console.log(`❌ JWT decode failed: ${decodeError.message}`);
        authMethod = "mock";
      }
    }
    
    // Fallback to mock verification - FIXED VERSION
    if (!decodedToken) {
      authMethod = "mock";
      console.log("🛠️ Using mock authentication");
      
      // Try to extract email from token if possible
      let email = 'user@example.com';
      
      // FIRST: Try to decode JWT from Firebase token
      if (idToken.includes('.') && idToken.split('.').length === 3) {
        try {
          const parts = idToken.split('.');
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          if (payload.email) {
            email = payload.email;
            console.log(`✅ Decoded email from JWT in mock mode: ${email}`);
          } else if (payload.user_email) {
            email = payload.user_email;
            console.log(`✅ Decoded user_email from JWT in mock mode: ${email}`);
          }
        } catch (e) {
          console.log("⚠️ Could not decode JWT in mock mode:", e.message);
        }
      }
      // SECOND: Check if token itself is an email
      else if (idToken.includes('@')) {
        email = idToken;
      }
      
      console.log(`📧 Mock auth using email: ${email}`);
      
      decodedToken = {
        uid: `mock-uid-${Date.now()}`,
        email: email,
        email_verified: true,
        name: email.split('@')[0],
        auth_method: 'mock'
      };
      
      // SPECIAL FIX: Check MongoDB for existing user with this email
      if (mongoose.connection.readyState === 1) {
        try {
          const existingUser = await User.findOne({ email: email });
          if (existingUser) {
            console.log(`✅ Found existing user in MongoDB for email: ${email}`);
            console.log(`   UID: ${existingUser.uid}, Role: ${existingUser.role}`);
            
            // Use the real UID from MongoDB instead of mock UID
            decodedToken.uid = existingUser.uid;
            decodedToken.name = existingUser.name || email.split('@')[0];
            decodedToken.picture = existingUser.photoURL;
            decodedToken.auth_method = 'mock_with_real_data';
            
            console.log(`🔄 Using real user data from MongoDB for: ${email}`);
          }
        } catch (dbError) {
          console.log("⚠️ Could not check MongoDB:", dbError.message);
        }
      }
    }
    
    console.log(`✅ Authentication successful via ${authMethod}: ${decodedToken.email}`);
    
    // FIXED: Find or create user in database with better search
    let user = null;
    
    if (mongoose.connection.readyState === 1) {
      // FIRST: Try to find by UID
      user = await User.findOne({ uid: decodedToken.uid });
      
      // SECOND: If not found by UID, try by email (important for mock mode)
      if (!user) {
        user = await User.findOne({ email: decodedToken.email });
        
        // If found by email but UID is different, update the UID
        if (user && user.uid !== decodedToken.uid) {
          console.log(`🔄 Updating UID for ${user.email}: ${user.uid} → ${decodedToken.uid}`);
          user.uid = decodedToken.uid;
          await user.save();
        }
      }
      
      // THIRD: If still not found, create new user
      if (!user) {
        console.log(`👤 Creating new user: ${decodedToken.email}`);
        
        // Set role based on email - IMPORTANT: This makes mahdiashan9@gmail.com admin
        let role = "user";
        if (decodedToken.email === "mahdiashan9@gmail.com") {
          role = "admin";
          console.log(`⭐ Setting ${decodedToken.email} as admin`);
        }
        
        user = new User({
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split('@')[0],
          photoURL: decodedToken.picture || decodedToken.photoURL,
          emailVerified: decodedToken.email_verified || false,
          role: role,
          lastLogin: new Date()
        });
        
        await user.save();
        console.log(`✅ User created: ${user.email} (${user.role})`);
      } else {
        console.log(`✅ User found: ${user.email} (${user.role})`);
        
        // SPECIAL FIX: If user is mahdiashan9@gmail.com and not admin, update to admin
        if (user.email === "mahdiashan9@gmail.com" && user.role !== "admin") {
          console.log(`⭐ Upgrading ${user.email} to admin role`);
          user.role = "admin";
        }
        
        // Update last login and user info if needed
        const needsUpdate = 
          user.name !== (decodedToken.name || decodedToken.email.split('@')[0]) ||
          user.photoURL !== (decodedToken.picture || decodedToken.photoURL) ||
          user.emailVerified !== (decodedToken.email_verified || false);
        
        if (needsUpdate) {
          user.name = decodedToken.name || decodedToken.email.split('@')[0];
          user.photoURL = decodedToken.picture || decodedToken.photoURL;
          user.emailVerified = decodedToken.email_verified || false;
        }
        
        user.lastLogin = new Date();
        await user.save();
      }
    } else {
      // Database not connected, use mock user
      console.log("⚠️ Database not connected, using mock user data");
      user = {
        _id: "mock-id",
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture,
        role: decodedToken.email === "mahdiashan9@gmail.com" ? "admin" : "user",
        emailVerified: decodedToken.email_verified || true,
        lastLogin: new Date()
      };
    }
    
    // Attach user to request
    req.user = decodedToken;
    req.mongoUser = user;
    req.authMethod = authMethod;
    
    next();
  } catch (error) {
    console.error("🔴 Authentication error:", error.message);
    console.error(error.stack);
    
    res.status(401).json({
      success: false,
      message: "Authentication failed",
      code: "AUTH_FAILED",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Role-based authorization middleware
 */
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
        message: `Access denied. Required role: ${roles.join(", ")}. Your role: ${req.mongoUser.role}`,
      });
    }

    next();
  };
};

// ========== PUBLIC ROUTES ==========
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎫 TicketBari API is running!",
    version: "2.0.1",
    timestamp: new Date().toISOString(),
    features: {
      authentication: firebaseInitialized ? "Firebase + MongoDB" : "Mock + MongoDB",
      database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      endpoints: ["/api/health", "/api/tickets", "/api/advertised", "/api/user/profile"]
    },
    adminEmail: "mahdiashan9@gmail.com"
  });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const health = {
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      firebase: firebaseInitialized ? "initialized" : "mock_mode",
      uptime: process.uptime(),
    },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    }
  };
  res.json(health);
});

// Public tickets endpoint
app.get("/api/tickets", async (req, res) => {
  try {
    const { limit = 12, page = 1, type, from, to } = req.query;
    
    let filter = { 
      verified: "approved", 
      isActive: true,
      departureAt: { $gt: new Date() }
    };
    
    if (type) filter.transportType = type;
    if (from) filter.from = new RegExp(from, "i");
    if (to) filter.to = new RegExp(to, "i");

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let tickets = [];
    let total = 0;

    if (mongoose.connection.readyState === 1) {
      tickets = await Ticket.find(filter)
        .sort({ departureAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await Ticket.countDocuments(filter);
    } else {
      // Mock data when DB is not connected
      tickets = [
        {
          _id: "sample-1",
          title: "Dhaka to Chittagong AC Bus",
          from: "Dhaka",
          to: "Chittagong",
          transportType: "bus",
          price: 1200,
          quantity: 40,
          availableQuantity: 25,
          image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500",
          vendorName: "Travel Express",
          verified: "approved",
          isActive: true,
          departureAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          perks: ["AC", "WiFi", "Water"]
        }
      ].slice(skip, skip + limitNum);
      
      total = 2;
    }

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        }
      }
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tickets",
    });
  }
});

// Advertised tickets endpoint
app.get("/api/advertised", async (req, res) => {
  try {
    let tickets = [];

    if (mongoose.connection.readyState === 1) {
      tickets = await Ticket.find({ 
        advertised: true, 
        verified: "approved", 
        isActive: true,
        departureAt: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .limit(6);
    } else {
      // Mock advertised tickets
      tickets = [
        {
          _id: "advertised-1",
          title: "Premium Dhaka to Cox's Bazar Bus",
          from: "Dhaka",
          to: "Cox's Bazar",
          transportType: "bus",
          price: 2500,
          quantity: 30,
          availableQuantity: 15,
          image: "https://images.unsplash.com/photo-1596394516093-9baa1d3d7f4c?w=500",
          advertised: true,
          verified: "approved",
          isActive: true,
          departureAt: new Date(Date.now() + 259200000),
          perks: ["Luxury", "AC", "TV", "Snacks"]
        }
      ];
    }

    res.json({
      success: true,
      data: {
        tickets,
        count: tickets.length
      }
    });
  } catch (error) {
    console.error("Error fetching advertised tickets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching advertised tickets",
    });
  }
});

// Get single ticket by ID
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    let ticket = null;
    
    if (mongoose.connection.readyState === 1) {
      ticket = await Ticket.findById(id);
    } else {
      // Mock ticket
      ticket = {
        _id: id,
        title: "Sample Ticket",
        from: "Dhaka",
        to: "Chittagong",
        transportType: "bus",
        price: 1200,
        quantity: 40,
        availableQuantity: 25,
        image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500",
        vendorName: "Travel Express",
        verified: "approved",
        isActive: true,
        departureAt: new Date(Date.now() + 86400000),
        description: "A comfortable AC bus journey from Dhaka to Chittagong.",
        perks: ["AC", "WiFi", "Water", "Snacks"]
      };
    }
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }
    
    res.json({
      success: true,
      data: { ticket }
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching ticket",
    });
  }
});

// ========== USER ROUTES ==========
// User profile endpoint - uses Firebase auth
app.get("/api/user/profile", firebaseAuthMiddleware, async (req, res) => {
  try {
    console.log(`📋 Returning profile for: ${req.mongoUser.email} (via ${req.authMethod})`);
    
    res.json({
      success: true,
      data: { 
        user: {
          _id: req.mongoUser._id,
          uid: req.mongoUser.uid,
          name: req.mongoUser.name,
          email: req.mongoUser.email,
          photoURL: req.mongoUser.photoURL,
          role: req.mongoUser.role,
          emailVerified: req.mongoUser.emailVerified,
          createdAt: req.mongoUser.createdAt,
          updatedAt: req.mongoUser.updatedAt,
          lastLogin: req.mongoUser.lastLogin
        }
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
});

// ========== DEBUG & UTILITY ROUTES ==========
// Token debugging endpoint
app.post("/api/debug/token-check", async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided"
      });
    }
    
    const analysis = {
      tokenInfo: {
        length: token.length,
        type: typeof token,
        first50: token.substring(0, 50),
        last50: token.substring(Math.max(0, token.length - 50)),
        hasDots: token.includes('.'),
        dotCount: (token.match(/\./g) || []).length
      },
      isValidJWT: false,
      decoded: null
    };
    
    // Try to decode as JWT
    if (token.includes('.') && token.split('.').length === 3) {
      try {
        const parts = token.split('.');
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        analysis.isValidJWT = true;
        analysis.decoded = {
          header,
          payload: {
            ...payload,
            exp_date: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
            iat_date: payload.iat ? new Date(payload.iat * 1000).toISOString() : null
          }
        };
      } catch (decodeError) {
        analysis.decodeError = decodeError.message;
      }
    }
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug auth check endpoint
app.get("/api/debug/auth-check", firebaseAuthMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          firebase: req.user,
          mongo: {
            _id: req.mongoUser._id,
            email: req.mongoUser.email,
            role: req.mongoUser.role,
            uid: req.mongoUser.uid
          },
          authMethod: req.authMethod
        },
        headers: {
          authorization: req.headers.authorization ? "Present" : "Missing"
        },
        isAdmin: req.mongoUser.role === "admin",
        adminEmailCheck: req.mongoUser.email === "mahdiashan9@gmail.com"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Force make admin endpoint
app.post("/api/debug/make-me-admin", firebaseAuthMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const updatedUser = await User.findOneAndUpdate(
        { email: req.mongoUser.email },
        { role: "admin" },
        { new: true }
      );
      
      res.json({
        success: true,
        message: `Made ${req.mongoUser.email} an admin`,
        data: { user: updatedUser }
      });
    } else {
      res.json({
        success: true,
        message: "Mock: Would make you admin if DB connected"
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug: Force sync with MongoDB user
app.get("/api/debug/force-sync/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log(`🔄 Force syncing user: ${email}`);
    
    // Find user in MongoDB
    const mongoUser = await User.findOne({ email: email });
    
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        message: `User ${email} not found in MongoDB`
      });
    }
    
    // Get all users for debugging
    const allUsers = await User.find({}).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        requestedEmail: email,
        foundUser: mongoUser,
        allUsers: allUsers.map(u => ({
          email: u.email,
          role: u.role,
          uid: u.uid,
          name: u.name
        })),
        totalUsers: allUsers.length
      }
    });
  } catch (error) {
    console.error("Error in force sync:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// List all users (debug)
app.get("/api/debug/users", async (req, res) => {
  try {
    let users = [];
    if (mongoose.connection.readyState === 1) {
      users = await User.find().sort({ createdAt: -1 }).limit(50);
    }
    
    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          _id: user._id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        })),
        count: users.length,
        dbConnected: mongoose.connection.readyState === 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Debug tickets endpoint
app.get("/api/debug/tickets", async (req, res) => {
  try {
    let allTickets = [];
    let stats = {};

    if (mongoose.connection.readyState === 1) {
      allTickets = await Ticket.find().sort({ createdAt: -1 }).limit(50);
      
      const counts = await Ticket.aggregate([
        { $group: { _id: "$verified", count: { $sum: 1 } } }
      ]);
      
      stats = {
        totalTickets: await Ticket.countDocuments(),
        approvedTickets: counts.find(c => c._id === "approved")?.count || 0,
        pendingTickets: counts.find(c => c._id === "pending")?.count || 0,
        rejectedTickets: counts.find(c => c._id === "rejected")?.count || 0,
        activeTickets: await Ticket.countDocuments({ isActive: true }),
        futureTickets: await Ticket.countDocuments({ departureAt: { $gt: new Date() } }),
        advertisedTickets: await Ticket.countDocuments({ advertised: true }),
        approvedActive: await Ticket.countDocuments({ 
          verified: "approved", 
          isActive: true,
          departureAt: { $gt: new Date() }
        })
      };
    } else {
      allTickets = [];
      stats = {
        totalTickets: 0,
        approvedTickets: 0,
        pendingTickets: 0,
        rejectedTickets: 0,
        activeTickets: 0,
        futureTickets: 0,
        advertisedTickets: 0,
        approvedActive: 0
      };
    }

    res.json({
      success: true,
      data: {
        allTickets,
        stats,
        dbConnected: mongoose.connection.readyState === 1
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Approve all tickets (debug utility)
app.post("/api/debug/approve-all", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const result = await Ticket.updateMany(
        {},
        { verified: "approved", isActive: true }
      );
      res.json({
        success: true,
        message: `Approved ${result.modifiedCount} tickets`,
        data: result
      });
    } else {
      res.json({
        success: true,
        message: "Mock: All tickets approved (DB not connected)"
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create sample tickets (debug)
app.post("/api/debug/create-sample-tickets", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const sampleTickets = [
        {
          title: "Dhaka to Chittagong Express",
          from: "Dhaka",
          to: "Chittagong",
          transportType: "bus",
          price: 1200,
          quantity: 40,
          vendorId: "vendor-001",
          vendorName: "Green Line",
          verified: "approved",
          advertised: true,
          departureAt: new Date(Date.now() + 86400000),
          description: "Premium AC bus service"
        },
        {
          title: "Dhaka to Sylhet Train",
          from: "Dhaka",
          to: "Sylhet",
          transportType: "train",
          price: 1800,
          quantity: 100,
          vendorId: "vendor-002",
          vendorName: "Bangladesh Railway",
          verified: "approved",
          advertised: false,
          departureAt: new Date(Date.now() + 172800000),
          description: "Intercity train service"
        }
      ];
      
      const createdTickets = await Ticket.insertMany(sampleTickets);
      
      res.json({
        success: true,
        message: `Created ${createdTickets.length} sample tickets`,
        data: createdTickets
      });
    } else {
      res.json({
        success: true,
        message: "Cannot create tickets - DB not connected"
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Test admin access
app.get("/api/debug/test-admin", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
  res.json({
    success: true,
    message: "Admin access confirmed!",
    data: {
      user: req.mongoUser.email,
      role: req.mongoUser.role,
      isAdmin: true
    }
  });
});

// ========== ADMIN ROUTES ==========
// Admin dashboard
app.get("/api/admin/dashboard", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    console.log(`📊 Admin dashboard accessed by: ${req.mongoUser.email} (${req.mongoUser.role})`);
    
    let totalUsers = 0;
    let totalTickets = 0;
    let totalBookings = 0;
    let pendingTickets = 0;
    let pendingVendorApplications = 0;
    let totalVendors = 0;

    if (mongoose.connection.readyState === 1) {
      [
        totalUsers,
        totalTickets,
        totalBookings,
        pendingTickets,
        pendingVendorApplications,
        totalVendors,
      ] = await Promise.all([
        User.countDocuments(),
        Ticket.countDocuments(),
        Booking.countDocuments(),
        Ticket.countDocuments({ verified: "pending" }),
        VendorApplication.countDocuments({ status: "pending" }),
        User.countDocuments({ role: "vendor" }),
      ]);
    } else {
      // Mock data
      totalUsers = 156;
      totalTickets = 342;
      totalBookings = 128;
      pendingTickets = 12;
      pendingVendorApplications = 5;
      totalVendors = 24;
    }

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
          revenue: 12500,
        }
      }
    });
  } catch (error) {
    console.error("Error in admin dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
    });
  }
});

// Admin users management
app.get("/api/admin/users", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { role = "all", search = "", page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (role !== "all") filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let users = [];
    let total = 0;
    let roleCounts = { total: 0, admins: 0, vendors: 0, regularUsers: 0 };

    if (mongoose.connection.readyState === 1) {
      users = await User.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await User.countDocuments(filter);

      // Get role counts
      const counts = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]);

      roleCounts.total = total;
      roleCounts.admins = counts.find(c => c._id === "admin")?.count || 0;
      roleCounts.vendors = counts.find(c => c._id === "vendor")?.count || 0;
      roleCounts.regularUsers = counts.find(c => c._id === "user")?.count || 0;
    } else {
      // Mock data
      users = [
        {
          _id: "1",
          uid: "test-admin-id",
          name: "Ashan Mahdi",
          email: "mahdiashan9@gmail.com",
          photoURL: "https://ui-avatars.com/api/?name=Ashan+Mahdi&background=random",
          role: "admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ].filter(user => {
        if (role !== "all" && user.role !== role) return false;
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });

      total = users.length;
      roleCounts = {
        total: 156,
        admins: 3,
        vendors: 24,
        regularUsers: 129,
      };
    }

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
        stats: roleCounts,
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
});

// Update user role
app.put("/api/admin/users/:id/role", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
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
    } else {
      // Mock response
      res.json({
        success: true,
        message: `User role updated to ${role} (mock)`,
        data: {
          user: {
            _id: req.params.id,
            role: role,
            name: "Mock User",
            email: "mock@example.com",
          }
        }
      });
    }
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
    });
  }
});

// Admin tickets management
app.get("/api/admin/tickets", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { verified = "all", page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (verified !== "all") filter.verified = verified;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let tickets = [];
    let total = 0;
    let stats = { total: 0, pending: 0, approved: 0, rejected: 0 };

    if (mongoose.connection.readyState === 1) {
      tickets = await Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await Ticket.countDocuments(filter);

      // Get status counts
      const counts = await Ticket.aggregate([
        { $group: { _id: "$verified", count: { $sum: 1 } } }
      ]);

      stats.total = total;
      stats.pending = counts.find(c => c._id === "pending")?.count || 0;
      stats.approved = counts.find(c => c._id === "approved")?.count || 0;
      stats.rejected = counts.find(c => c._id === "rejected")?.count || 0;
    } else {
      // Mock data
      tickets = [
        {
          _id: "1",
          title: "Dhaka to Chittagong",
          from: "Dhaka",
          to: "Chittagong",
          transportType: "bus",
          price: 1200,
          quantity: 40,
          availableQuantity: 25,
          vendorId: "vendor1",
          vendorName: "Travel Express",
          verified: "approved",
          isActive: true,
          departureAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }
      ].filter(ticket => verified === "all" || ticket.verified === verified);

      total = tickets.length;
      stats = {
        total: 342,
        pending: 12,
        approved: 325,
        rejected: 5,
      };
    }

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
        stats,
      }
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tickets",
    });
  }
});

// Verify/Reject ticket
app.put("/api/admin/tickets/:id/verify", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (mongoose.connection.readyState === 1) {
      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        { 
          verified: status,
          isActive: status === "approved"
        },
        { new: true }
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      res.json({
        success: true,
        message: `Ticket ${status} successfully`,
        data: { ticket },
      });
    } else {
      // Mock response
      res.json({
        success: true,
        message: `Ticket ${status} successfully (mock)`,
        data: {
          ticket: {
            _id: req.params.id,
            verified: status,
            isActive: status === "approved",
            title: "Mock Ticket",
          }
        }
      });
    }
  } catch (error) {
    console.error("Error verifying ticket:", error);
    res.status(500).json({
      success: false,
      message: "Error updating ticket",
    });
  }
});

// Admin vendor applications
app.get("/api/admin/vendor-applications", firebaseAuthMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status !== "all") filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let applications = [];
    let total = 0;
    let stats = { total: 0, pending: 0, approved: 0, rejected: 0 };

    if (mongoose.connection.readyState === 1) {
      applications = await VendorApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await VendorApplication.countDocuments(filter);

      // Get status counts
      const counts = await VendorApplication.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      stats.total = total;
      stats.pending = counts.find(c => c._id === "pending")?.count || 0;
      stats.approved = counts.find(c => c._id === "approved")?.count || 0;
      stats.rejected = counts.find(c => c._id === "rejected")?.count || 0;
    } else {
      // Mock data
      applications = [
        {
          _id: "1",
          userId: "user4",
          userName: "Bob Wilson",
          userEmail: "bob@example.com",
          businessName: "Wilson Travels",
          contactName: "Bob Wilson",
          phone: "+8801712345678",
          businessType: "Travel Agency",
          description: "Premium travel services",
          address: "123 Main St, Dhaka",
          status: "pending",
          createdAt: new Date().toISOString(),
        }
      ].filter(app => status === "all" || app.status === status);

      total = applications.length;
      stats = {
        total: 8,
        pending: 5,
        approved: 2,
        rejected: 1,
      };
    }

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
        stats,
      }
    });
  } catch (error) {
    console.error("Error fetching vendor applications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching applications",
    });
  }
});

// ========== ERROR HANDLERS ==========
// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`🔍 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("=".repeat(70));
  console.log("🚀 TICKETBARI BACKEND SERVER STARTED");
  console.log("=".repeat(70));
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`🔐 Auth Mode: ${firebaseInitialized ? "Firebase Admin" : "Mock Authentication"}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`);
  console.log(`👑 Admin Email: mahdiashan9@gmail.com`);
  console.log("=".repeat(70));
  console.log("📋 IMPORTANT DEBUG ENDPOINTS:");
  console.log("   GET  /api/debug/users           - List all users in database");
  console.log("   GET  /api/debug/auth-check      - Check authentication status");
  console.log("   POST /api/debug/make-me-admin   - Force make user admin");
  console.log("   GET  /api/debug/test-admin      - Test admin access");
  console.log("   POST /api/debug/token-check     - Analyze token");
  console.log("   GET  /api/debug/force-sync/:email - Force sync specific user");
  console.log("=".repeat(70));
  console.log("🔧 QUICK FIX STEPS:");
  console.log("   1. Clear browser: localStorage.clear()");
  console.log("   2. Login with Google (mahdiashan9@gmail.com)");
  console.log("   3. Check: GET /api/debug/auth-check");
  console.log("   4. If not admin: POST /api/debug/make-me-admin");
  console.log("=".repeat(70));
});