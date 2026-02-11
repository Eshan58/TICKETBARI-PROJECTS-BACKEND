
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();

// ========== BULLETPROOF CORS CONFIGURATION ==========
// This MUST be at the VERY BEGINNING, before any other middleware

// 1. Manual CORS middleware for ALL requests
app.use((req, res, next) => {
  // Set CORS headers
  res.header("Access-Control-Allow-Origin", "https://ticketbari-projects.web.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  
  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    console.log(`✅ Handling OPTIONS preflight for: ${req.url}`);
    return res.status(200).end();
  }
  
  next();
});

// 2. Body parser middleware
app.use(bodyParser.json());

// 3. Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// ========== FIREBASE ADMIN INITIALIZATION ==========
let firebaseInitialized = false;

try {
  if (!admin.apps.length) {
    if (!process.env.FB_SERVICE_KEY) {
      console.error("❌ FB_SERVICE_KEY missing");
    } else {
      const decoded = Buffer.from(
        process.env.FB_SERVICE_KEY,
        "base64"
      ).toString("utf8");

      const serviceAccount = JSON.parse(decoded);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseInitialized = true;
      console.log("✅ Firebase Admin initialized");
    }
  }
} catch (error) {
  console.error("❌ Firebase init error:", error.message);
}

// Create mock Firebase admin for development
if (!firebaseInitialized) {
  global.firebaseAdminMock = {
    auth: () => ({
      verifyIdToken: async (idToken, checkRevoked = false) => {
        console.log("🛠️ Mock Firebase token verification");

        // Try to decode as JWT
        if (
          idToken &&
          idToken.includes(".") &&
          idToken.split(".").length === 3
        ) {
          try {
            const parts = idToken.split(".");
            const header = JSON.parse(
              Buffer.from(parts[0], "base64").toString()
            );
            const payload = JSON.parse(
              Buffer.from(parts[1], "base64").toString()
            );

            console.log("✅ Mock decoded JWT:", {
              alg: header.alg,
              email: payload.email || payload.user_email,
              uid: payload.user_id || payload.sub,
            });

            return {
              uid: payload.user_id || payload.sub || `mock-uid-${Date.now()}`,
              email: payload.email || payload.user_email || "user@example.com",
              email_verified: true,
              name:
                payload.name ||
                (payload.email ? payload.email.split("@")[0] : "User"),
            };
          } catch (e) {
            console.log("⚠️ Could not decode as JWT in mock mode:", e.message);
          }
        }

        // Fallback: treat token as email or generate mock user
        let email = "user@example.com";
        if (idToken && idToken.includes("@")) {
          email = idToken;
        }

        // Special case for admin email
        const isAdminEmail = email === "mahdiashan9@gmail.com";

        return {
          uid: `mock-uid-${Date.now()}`,
          email: email,
          email_verified: true,
          name: email.split("@")[0],
          admin: isAdminEmail, // Add admin flag for mock mode
        };
      },
    }),
  };
}

// ========== DATABASE CONNECTION ==========
mongoose.set("strictQuery", false);
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ticketbari";

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
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    photoURL: String,
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    phoneNumber: String,
    providerData: [
      {
        providerId: String,
        uid: String,
        displayName: String,
        email: String,
        photoURL: String,
      },
    ],
    lastLogin: { type: Date, default: Date.now },
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
const VendorApplication = mongoose.model(
  "VendorApplication",
  vendorApplicationSchema
);

// ========== AUTHENTICATION MIDDLEWARE ==========
async function firebaseAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if authorization header exists
  if (!authHeader) {
    console.log("🔴 No authorization header provided");
    return res.status(401).json({
      success: false,
      message: "No authentication token provided",
      code: "NO_TOKEN",
    });
  }

  // Check if it's a Bearer token
  if (!authHeader.startsWith("Bearer ")) {
    console.log("🔴 Invalid authorization format. Expected 'Bearer <token>'");
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format. Expected 'Bearer <token>'",
      code: "INVALID_FORMAT",
    });
  }

  const idToken = authHeader.split("Bearer ")[1];

  // Validate token exists
  if (!idToken || idToken.trim() === "") {
    console.log("🔴 Empty token provided");
    return res.status(401).json({
      success: false,
      message: "Empty token provided",
      code: "EMPTY_TOKEN",
    });
  }

  console.log(`🔑 Token received: ${idToken.length} characters`);

  // Basic token validation
  if (idToken.length < 50) {
    console.log("❌ Token too short (likely invalid)");
    return res.status(401).json({
      success: false,
      message: "Invalid token format",
      code: "TOKEN_TOO_SHORT",
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
        console.log(
          `✅ Firebase Admin verification successful for: ${decodedToken.email}`
        );
      } catch (firebaseError) {
        console.log(
          `❌ Firebase Admin verification failed: ${firebaseError.code} - ${firebaseError.message}`
        );

        // Handle specific Firebase errors
        if (firebaseError.code === "auth/id-token-expired") {
          return res.status(401).json({
            success: false,
            message: "Token expired. Please login again.",
            code: "TOKEN_EXPIRED",
          });
        }

        if (firebaseError.code === "auth/argument-error") {
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
        if (idToken.includes(".") && idToken.split(".").length === 3) {
          const parts = idToken.split(".");

          // Decode header
          const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString()
          );

          console.log(
            `✅ JWT decoded successfully: ${payload.email || "no email"}`
          );

          decodedToken = {
            uid: payload.user_id || payload.sub || `jwt-uid-${Date.now()}`,
            email: payload.email || payload.user_email || "user@example.com",
            email_verified: payload.email_verified || true,
            name:
              payload.name ||
              (payload.email ? payload.email.split("@")[0] : "User"),
            picture: payload.picture,
            iss: payload.iss,
            aud: payload.aud,
            iat: payload.iat,
            exp: payload.exp,
          };

          authMethod = "jwt_decode";
        }
      } catch (decodeError) {
        console.log(`❌ JWT decode failed: ${decodeError.message}`);
        authMethod = "mock";
      }
    }

    // Fallback to mock verification
    if (!decodedToken) {
      authMethod = "mock";
      console.log("🛠️ Using mock authentication");

      // Try to extract email from token if possible
      let email = "user@example.com";

      // FIRST: Try to decode JWT from Firebase token
      if (idToken.includes(".") && idToken.split(".").length === 3) {
        try {
          const parts = idToken.split(".");
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString()
          );

          if (payload.email) {
            email = payload.email;
            console.log(`✅ Decoded email from JWT in mock mode: ${email}`);
          } else if (payload.user_email) {
            email = payload.user_email;
            console.log(
              `✅ Decoded user_email from JWT in mock mode: ${email}`
            );
          }
        } catch (e) {
          console.log("⚠️ Could not decode JWT in mock mode:", e.message);
        }
      }
      // SECOND: Check if token itself is an email
      else if (idToken.includes("@")) {
        email = idToken;
      }

      console.log(`📧 Mock auth using email: ${email}`);

      decodedToken = {
        uid: `mock-uid-${Date.now()}`,
        email: email,
        email_verified: true,
        name: email.split("@")[0],
        auth_method: "mock",
      };

      // SPECIAL FIX: Check MongoDB for existing user with this email
      if (mongoose.connection.readyState === 1) {
        try {
          const existingUser = await User.findOne({ email: email });
          if (existingUser) {
            console.log(
              `✅ Found existing user in MongoDB for email: ${email}`
            );
            console.log(
              `   UID: ${existingUser.uid}, Role: ${existingUser.role}`
            );

            // Use the real UID from MongoDB instead of mock UID
            decodedToken.uid = existingUser.uid;
            decodedToken.name = existingUser.name || email.split("@")[0];
            decodedToken.picture = existingUser.photoURL;
            decodedToken.auth_method = "mock_with_real_data";

            console.log(`🔄 Using real user data from MongoDB for: ${email}`);
          }
        } catch (dbError) {
          console.log("⚠️ Could not check MongoDB:", dbError.message);
        }
      }
    }

    console.log(
      `✅ Authentication successful via ${authMethod}: ${decodedToken.email}`
    );

    // Find or create user in database
    let user = null;

    if (mongoose.connection.readyState === 1) {
      // FIRST: Try to find by UID
      user = await User.findOne({ uid: decodedToken.uid });

      // SECOND: If not found by UID, try by email
      if (!user) {
        user = await User.findOne({ email: decodedToken.email });

        // If found by email but UID is different, update the UID
        if (user && user.uid !== decodedToken.uid) {
          console.log(
            `🔄 Updating UID for ${user.email}: ${user.uid} → ${decodedToken.uid}`
          );
          user.uid = decodedToken.uid;
          await user.save();
        }
      }

      // THIRD: If still not found, create new user
      if (!user) {
        console.log(`👤 Creating new user: ${decodedToken.email}`);

        // Set role based on email
        let role = "user";
        if (decodedToken.email === "mahdiashan9@gmail.com") {
          role = "admin";
          console.log(`⭐ Setting ${decodedToken.email} as admin`);
        }

        user = new User({
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split("@")[0],
          photoURL: decodedToken.picture || decodedToken.photoURL,
          emailVerified: decodedToken.email_verified || false,
          role: role,
          lastLogin: new Date(),
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
          user.name !==
            (decodedToken.name || decodedToken.email.split("@")[0]) ||
          user.photoURL !== (decodedToken.picture || decodedToken.photoURL) ||
          user.emailVerified !== (decodedToken.email_verified || false);

        if (needsUpdate) {
          user.name = decodedToken.name || decodedToken.email.split("@")[0];
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
        name: decodedToken.name || decodedToken.email.split("@")[0],
        photoURL: decodedToken.picture,
        role: decodedToken.email === "mahdiashan9@gmail.com" ? "admin" : "user",
        emailVerified: decodedToken.email_verified || true,
        lastLogin: new Date(),
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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
        message: `Access denied. Required role: ${roles.join(
          ", "
        )}. Your role: ${req.mongoUser.role}`,
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
      authentication: firebaseInitialized
        ? "Firebase + MongoDB"
        : "Mock + MongoDB",
      database:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      endpoints: [
        "/api/health",
        "/api/tickets",
        "/api/advertised",
        "/api/user/profile",
      ],
    },
    adminEmail: "mahdiashan9@gmail.com",
  });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const health = {
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      firebase: firebaseInitialized ? "initialized" : "mock_mode",
      uptime: process.uptime(),
    },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(
        process.memoryUsage().heapTotal / 1024 / 1024
      )} MB`,
      heapUsed: `${Math.round(
        process.memoryUsage().heapUsed / 1024 / 1024
      )} MB`,
    },
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
      departureAt: { $gt: new Date() },
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
          image:
            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500",
          vendorName: "Travel Express",
          verified: "approved",
          isActive: true,
          departureAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          perks: ["AC", "WiFi", "Water"],
        },
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
        },
      },
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
        departureAt: { $gt: new Date() },
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
          image:
            "https://images.unsplash.com/photo-1596394516093-9baa1d3d7f4c?w=500",
          advertised: true,
          verified: "approved",
          isActive: true,
          departureAt: new Date(Date.now() + 259200000),
          perks: ["Luxury", "AC", "TV", "Snacks"],
        },
      ];
    }

    res.json({
      success: true,
      data: {
        tickets,
        count: tickets.length,
      },
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
        image:
          "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500",
        vendorName: "Travel Express",
        verified: "approved",
        isActive: true,
        departureAt: new Date(Date.now() + 86400000),
        description: "A comfortable AC bus journey from Dhaka to Chittagong.",
        perks: ["AC", "WiFi", "Water", "Snacks"],
      };
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      data: { ticket },
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
// User profile endpoint
app.get("/api/user/profile", firebaseAuthMiddleware, async (req, res) => {
  try {
    console.log(
      `📋 Returning profile for: ${req.mongoUser.email} (via ${req.authMethod})`
    );

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
          lastLogin: req.mongoUser.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
});

// User dashboard endpoint
app.get("/api/user/dashboard", firebaseAuthMiddleware, async (req, res) => {
  try {
    console.log(
      `📊 User dashboard accessed by: ${req.mongoUser.email} (${req.mongoUser.role})`
    );

    let stats = {
      totalBooked: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      totalSpent: 0,
    };

    let recentBookings = [];
    let memberSince = req.mongoUser.createdAt || new Date();

    if (mongoose.connection.readyState === 1) {
      // Get all bookings for the user
      const userBookings = await Booking.find({
        userId: req.mongoUser.uid,
      })
        .sort({ createdAt: -1 })
        .limit(10);

      // Calculate stats
      stats.totalBooked = userBookings.length;

      // Count by status
      userBookings.forEach((booking) => {
        if (booking.status === "pending") stats.pending++;
        if (booking.status === "confirmed") stats.confirmed++;
        if (booking.status === "cancelled") stats.cancelled++;
      });

      // Calculate total spent from confirmed bookings
      const confirmedBookings = await Booking.find({
        userId: req.mongoUser.uid,
        status: "confirmed",
      });

      stats.totalSpent = confirmedBookings.reduce((sum, booking) => {
        return sum + (booking.totalPrice || 0);
      }, 0);

      // Get recent bookings with ticket details
      recentBookings = await Promise.all(
        userBookings.map(async (booking) => {
          let ticketDetails = null;
          if (booking.ticketId) {
            ticketDetails = await Ticket.findById(booking.ticketId);
          }

          return {
            _id: booking._id,
            userId: booking.userId,
            userName: booking.userName || req.mongoUser.name,
            userEmail: booking.userEmail || req.mongoUser.email,
            ticketId: booking.ticketId,
            ticketTitle:
              booking.ticketTitle ||
              (ticketDetails ? ticketDetails.title : "Unknown Ticket"),
            quantity: booking.quantity,
            totalPrice: booking.totalPrice,
            status: booking.status,
            bookingReference: booking.bookingReference,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            ticketDetails: ticketDetails,
          };
        })
      );
    } else {
      // Mock data for when DB is not connected
      stats = {
        totalBooked: 5,
        pending: 2,
        confirmed: 2,
        cancelled: 1,
        totalSpent: 4500,
      };

      recentBookings = [
        {
          _id: "booking-1",
          ticketTitle: "Dhaka to Chittagong AC Bus",
          ticketDetails: {
            _id: "ticket-1",
            from: "Dhaka",
            to: "Chittagong",
            departureAt: new Date(Date.now() + 86400000),
          },
          quantity: 2,
          totalPrice: 2400,
          status: "confirmed",
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          _id: "booking-2",
          ticketTitle: "Dhaka to Sylhet Train",
          ticketDetails: {
            _id: "ticket-2",
            from: "Dhaka",
            to: "Sylhet",
            departureAt: new Date(Date.now() + 172800000),
          },
          quantity: 1,
          totalPrice: 1800,
          status: "pending",
          createdAt: new Date(Date.now() - 43200000),
        },
      ];

      memberSince = new Date(Date.now() - 30 * 86400000);
    }

    res.json({
      success: true,
      data: {
        stats,
        recentBookings,
        user: {
          _id: req.mongoUser._id,
          uid: req.mongoUser.uid,
          name: req.mongoUser.name,
          email: req.mongoUser.email,
          photoURL: req.mongoUser.photoURL,
          role: req.mongoUser.role,
          emailVerified: req.mongoUser.emailVerified,
          memberSince: memberSince,
          createdAt: req.mongoUser.createdAt,
          updatedAt: req.mongoUser.updatedAt,
          lastLogin: req.mongoUser.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ========== USER BOOKING ENDPOINTS ==========
// POST /api/bookings - Create a new booking
app.post("/api/bookings", firebaseAuthMiddleware, async (req, res) => {
  try {
    const { ticketId, quantity } = req.body;

    if (!ticketId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID and quantity are required",
      });
    }

    console.log(`🎟️ Creating booking for user: ${req.mongoUser.email}`);

    let ticket = null;
    let newBooking = null;
    let bookingReference = `BK-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    if (mongoose.connection.readyState === 1) {
      // Find the ticket
      ticket = await Ticket.findById(ticketId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      // Check if ticket is approved and active
      if (ticket.verified !== "approved" || !ticket.isActive) {
        return res.status(400).json({
          success: false,
          message: "This ticket is not available for booking",
        });
      }

      // Check if ticket has departed
      if (ticket.departureAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: "This ticket has already departed",
        });
      }

      // Check available quantity
      if (quantity > ticket.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${ticket.availableQuantity} seats available`,
        });
      }

      // Calculate total price
      const totalPrice = ticket.price * quantity;

      // Create booking
      newBooking = new Booking({
        userId: req.mongoUser.uid,
        userName: req.mongoUser.name,
        userEmail: req.mongoUser.email,
        ticketId: ticket._id,
        ticketTitle: ticket.title,
        quantity: quantity,
        totalPrice: totalPrice,
        status: "pending",
        bookingReference: bookingReference,
      });

      await newBooking.save();

      console.log(
        `✅ Booking created for user ${req.mongoUser.email}: ${bookingReference}`
      );
    } else {
      // Mock data
      ticket = {
        _id: ticketId,
        title: "Mock Ticket",
        price: 1200,
        availableQuantity: 10,
      };

      const totalPrice = ticket.price * quantity;

      newBooking = {
        _id: "mock-booking-id",
        userId: req.mongoUser.uid,
        userName: req.mongoUser.name,
        userEmail: req.mongoUser.email,
        ticketId: ticketId,
        ticketTitle: "Mock Ticket",
        quantity: quantity,
        totalPrice: totalPrice,
        status: "pending",
        bookingReference: bookingReference,
        createdAt: new Date(),
      };

      console.log("⚠️ Mock: Booking would be created if DB connected");
    }

    res.json({
      success: true,
      message: "Booking created successfully! Please wait for admin approval.",
      data: {
        booking: newBooking,
        ticket: ticket,
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/my-bookings - Get user's bookings
app.get("/api/my-bookings", firebaseAuthMiddleware, async (req, res) => {
  try {
    console.log(`📋 Getting bookings for user: ${req.mongoUser.email}`);

    let bookings = [];

    if (mongoose.connection.readyState === 1) {
      bookings = await Booking.find({ userId: req.mongoUser.uid })
        .sort({ createdAt: -1 })
        .populate(
          "ticketId",
          "title from to departureAt transportType price vendorName"
        );
    } else {
      // Mock data
      bookings = [
        {
          _id: "booking-001",
          ticketId: {
            _id: "ticket-001",
            title: "Dhaka to Chittagong AC Bus",
            from: "Dhaka",
            to: "Chittagong",
            departureAt: new Date(Date.now() + 86400000),
          },
          ticketTitle: "Dhaka to Chittagong AC Bus",
          quantity: 2,
          totalPrice: 2400,
          status: "pending",
          bookingReference: "BK-20240101-001",
          createdAt: new Date(Date.now() - 86400000),
        },
      ];
    }

    res.json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ========== VENDOR ROUTES ==========
// Vendor dashboard stats
app.get(
  "/api/vendor/dashboard/stats",
  firebaseAuthMiddleware,
  requireRole(["vendor"]),
  async (req, res) => {
    try {
      console.log(
        `📊 Vendor dashboard stats requested by: ${req.mongoUser.email}`
      );

      let stats = {
        totalCards: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        totalRevenue: 0,
      };

      if (mongoose.connection.readyState === 1) {
        // Count vendor's tickets/cards
        const vendorId = req.mongoUser.uid;
        stats.totalCards = await Ticket.countDocuments({ vendorId: vendorId });

        // Count pending applications for vendor's cards
        const vendorCards = await Ticket.find({ vendorId: vendorId }).select(
          "_id"
        );
        const cardIds = vendorCards.map((card) => card._id);

        // Get bookings for vendor's tickets
        const vendorBookings = await Booking.find({
          ticketId: { $in: cardIds },
          status: { $in: ["confirmed", "completed"] },
        });

        // Count applications for vendor's cards
        const pendingBookings = await Booking.find({
          ticketId: { $in: cardIds },
          status: "pending",
        });

        stats.pendingApplications = pendingBookings.length;
        stats.approvedApplications = vendorBookings.length;

        // Calculate total revenue
        stats.totalRevenue = vendorBookings.reduce((total, booking) => {
          return total + (booking.totalPrice || 0);
        }, 0);
      } else {
        // Mock data
        stats = {
          totalCards: 12,
          pendingApplications: 5,
          approvedApplications: 24,
          totalRevenue: 12500,
        };
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching vendor dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching dashboard stats",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get vendor's cards/tickets
app.get(
  "/api/vendor/cards",
  firebaseAuthMiddleware,
  requireRole(["vendor"]),
  async (req, res) => {
    try {
      console.log(`🎟️ Vendor cards requested by: ${req.mongoUser.email}`);

      let cards = [];

      if (mongoose.connection.readyState === 1) {
        const vendorId = req.mongoUser.uid;
        cards = await Ticket.find({ vendorId: vendorId }).sort({
          createdAt: -1,
        });
      } else {
        // Mock data
        cards = [
          {
            _id: "card-1",
            title: "Concert Ticket - Summer Fest",
            description: "Annual summer music festival",
            price: 50,
            category: "concert",
            location: "Dhaka Stadium",
            availableSlots: 25,
            startDate: new Date(Date.now() + 86400000 * 7),
            endDate: new Date(Date.now() + 86400000 * 7 + 3600000 * 4),
            status: "active",
            verified: "approved",
            isActive: true,
            createdAt: new Date(),
          },
          {
            _id: "card-2",
            title: "Football Match - National Cup",
            description: "Final match of national football cup",
            price: 30,
            category: "sports",
            location: "Bangabandhu Stadium",
            availableSlots: 10,
            startDate: new Date(Date.now() + 86400000 * 3),
            endDate: new Date(Date.now() + 86400000 * 3 + 3600000 * 2),
            status: "active",
            verified: "approved",
            isActive: true,
            createdAt: new Date(Date.now() - 86400000),
          },
        ];
      }

      res.json({
        success: true,
        data: cards,
      });
    } catch (error) {
      console.error("Error fetching vendor cards:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching cards",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Create new card/ticket (vendor)
app.post(
  "/api/vendor/cards",
  firebaseAuthMiddleware,
  requireRole(["vendor"]),
  async (req, res) => {
    try {
      console.log(`➕ Creating new card for vendor: ${req.mongoUser.email}`);

      const {
        title,
        description,
        price,
        category,
        location,
        availableSlots,
        startDate,
        endDate,
      } = req.body;

      // Validate required fields
      if (
        !title ||
        !description ||
        !price ||
        !category ||
        !location ||
        !availableSlots ||
        !startDate ||
        !endDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Please fill all required fields",
        });
      }

      let newCard = null;

      if (mongoose.connection.readyState === 1) {
        // Create new ticket/card
        newCard = new Ticket({
          title: title,
          description: description,
          price: parseFloat(price),
          category: category,
          location: location,
          quantity: parseInt(availableSlots),
          availableQuantity: parseInt(availableSlots),
          departureAt: new Date(startDate),
          endDate: new Date(endDate),
          vendorId: req.mongoUser.uid,
          vendorName: req.mongoUser.name || req.mongoUser.email.split("@")[0],
          transportType: "event",
          from: location,
          to: location,
          verified: "pending",
          isActive: true,
        });

        await newCard.save();
        console.log(`✅ Card created: ${newCard.title}`);
      } else {
        // Mock response
        newCard = {
          _id: `card-${Date.now()}`,
          title,
          description,
          price: parseFloat(price),
          category,
          location,
          availableSlots: parseInt(availableSlots),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: "pending",
          createdAt: new Date(),
        };

        console.log("⚠️ Mock: Card would be created if DB connected");
      }

      res.json({
        success: true,
        message: "Card created successfully! Waiting for admin approval.",
        data: { card: newCard },
      });
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({
        success: false,
        message: "Error creating card",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get vendor's applications (bookings for vendor's cards)
app.get(
  "/api/vendor/applications",
  firebaseAuthMiddleware,
  requireRole(["vendor"]),
  async (req, res) => {
    try {
      const { status = "all" } = req.query;
      console.log(
        `📋 Vendor applications requested by: ${req.mongoUser.email}, status: ${status}`
      );

      let applications = [];

      if (mongoose.connection.readyState === 1) {
        const vendorId = req.mongoUser.uid;

        // Get vendor's cards
        const vendorCards = await Ticket.find({ vendorId: vendorId }).select(
          "_id title price"
        );
        const cardIds = vendorCards.map((card) => card._id);

        // Build filter for bookings
        let filter = { ticketId: { $in: cardIds } };
        if (status !== "all") {
          filter.status = status;
        }

        // Get bookings for vendor's cards
        const bookings = await Booking.find(filter)
          .sort({ createdAt: -1 })
          .populate("ticketId", "title price");

        // Format as applications
        applications = bookings.map((booking) => ({
          _id: booking._id,
          user: {
            name: booking.userName,
            email: booking.userEmail,
          },
          card: {
            title: booking.ticketId?.title || booking.ticketTitle,
            price: booking.ticketId?.price,
          },
          status: booking.status,
          createdAt: booking.createdAt,
          quantity: booking.quantity,
          totalPrice: booking.totalPrice,
        }));
      } else {
        // Mock data
        applications = [
          {
            _id: "app-1",
            user: {
              name: "John Doe",
              email: "john@example.com",
            },
            card: {
              title: "Concert Ticket - Summer Fest",
              price: 50,
            },
            status: "pending",
            createdAt: new Date(Date.now() - 86400000),
            quantity: 2,
            totalPrice: 100,
          },
          {
            _id: "app-2",
            user: {
              name: "Jane Smith",
              email: "jane@example.com",
            },
            card: {
              title: "Football Match - National Cup",
              price: 30,
            },
            status: "approved",
            createdAt: new Date(Date.now() - 172800000),
            quantity: 1,
            totalPrice: 30,
          },
        ].filter((app) => status === "all" || app.status === status);
      }

      res.json({
        success: true,
        data: applications,
      });
    } catch (error) {
      console.error("Error fetching vendor applications:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching applications",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Approve/Reject application
app.put(
  "/api/vendor/applications/:id/:action",
  firebaseAuthMiddleware,
  requireRole(["vendor"]),
  async (req, res) => {
    try {
      const { id, action } = req.params;

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Invalid action. Must be 'approve' or 'reject'",
        });
      }

      console.log(`📝 Vendor ${action}ing application ${id}`);

      let updatedApplication = null;

      if (mongoose.connection.readyState === 1) {
        const status = action === "approve" ? "confirmed" : "cancelled";

        // Find and update booking
        updatedApplication = await Booking.findByIdAndUpdate(
          id,
          { status: status, updatedAt: new Date() },
          { new: true }
        );

        if (!updatedApplication) {
          return res.status(404).json({
            success: false,
            message: "Application not found",
          });
        }

        // If approving, reduce available quantity
        if (action === "approve" && updatedApplication.ticketId) {
          const ticket = await Ticket.findById(updatedApplication.ticketId);
          if (ticket) {
            ticket.availableQuantity = Math.max(
              0,
              ticket.availableQuantity - updatedApplication.quantity
            );
            await ticket.save();
            console.log(
              `✅ Reduced available quantity for ticket ${ticket._id}`
            );
          }
        }
      } else {
        // Mock response
        updatedApplication = {
          _id: id,
          status: action === "approve" ? "confirmed" : "cancelled",
          updatedAt: new Date(),
        };

        console.log(`⚠️ Mock: Application ${id} ${action}ed`);
      }

      res.json({
        success: true,
        message: `Application ${action}ed successfully`,
        data: { application: updatedApplication },
      });
    } catch (error) {
      console.error(`Error ${req.params.action}ing application:`, error);
      res.status(500).json({
        success: false,
        message: `Error ${req.params.action}ing application`,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Delete vendor card
app.delete(
  "/api/vendor/cards/:id",
  firebaseAuthMiddleware,
  requireRole(["vendor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting vendor card ${id}`);

      if (mongoose.connection.readyState === 1) {
        // Check if card belongs to vendor
        const card = await Ticket.findById(id);

        if (!card) {
          return res.status(404).json({
            success: false,
            message: "Card not found",
          });
        }

        if (card.vendorId !== req.mongoUser.uid) {
          return res.status(403).json({
            success: false,
            message: "You don't have permission to delete this card",
          });
        }

        // Delete the card
        await Ticket.findByIdAndDelete(id);
        console.log(`✅ Card deleted: ${card.title}`);
      } else {
        console.log("⚠️ Mock: Card would be deleted if DB connected");
      }

      res.json({
        success: true,
        message: "Card deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting card",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Submit vendor application
app.post("/api/apply-vendor", firebaseAuthMiddleware, async (req, res) => {
  try {
    console.log(`📋 Vendor application submitted by: ${req.mongoUser.email}`);

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

    // Validate required fields
    if (
      !businessName ||
      !contactName ||
      !phone ||
      !businessType ||
      !description ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    let application;

    if (mongoose.connection.readyState === 1) {
      // Check if user already has a pending application
      const existingApplication = await VendorApplication.findOne({
        userId: req.mongoUser.uid,
        status: "pending",
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: "You already have a pending vendor application",
        });
      }

      // Check if user is already a vendor
      if (req.mongoUser.role === "vendor") {
        return res.status(400).json({
          success: false,
          message: "You are already a vendor",
        });
      }

      // Create new application
      application = new VendorApplication({
        userId: req.mongoUser.uid,
        userName: req.mongoUser.name,
        userEmail: req.mongoUser.email,
        businessName,
        contactName,
        phone,
        businessType,
        description,
        website: website || "",
        address,
        taxId: taxId || "",
        status: "pending",
      });

      await application.save();
      console.log(`✅ Vendor application saved for: ${req.mongoUser.email}`);
    } else {
      // Mock response when DB is not connected
      application = {
        _id: "mock-application-id",
        businessName,
        contactName,
        phone,
        businessType,
        description,
        website,
        address,
        taxId,
        status: "pending",
        createdAt: new Date(),
      };

      console.log("⚠️ Mock: Vendor application would be saved if DB connected");
    }

    res.json({
      success: true,
      message: "Vendor application submitted successfully!",
      data: { application },
    });
  } catch (error) {
    console.error("Error submitting vendor application:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting application",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get my vendor application status
app.get(
  "/api/my-vendor-application",
  firebaseAuthMiddleware,
  async (req, res) => {
    try {
      console.log(`📋 Checking vendor application for: ${req.mongoUser.email}`);

      let application = null;

      if (mongoose.connection.readyState === 1) {
        // Find latest application for this user
        application = await VendorApplication.findOne({
          userId: req.mongoUser.uid,
        }).sort({ createdAt: -1 });

        if (!application) {
          return res.json({
            success: true,
            data: {
              hasApplication: false,
              message: "No vendor application found",
            },
          });
        }
      } else {
        // Mock response
        application = null;
      }

      res.json({
        success: true,
        data: {
          hasApplication: !!application,
          application: application,
          userRole: req.mongoUser.role,
          isVendor: req.mongoUser.role === "vendor",
        },
      });
    } catch (error) {
      console.error("Error fetching vendor application:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching application",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Review vendor application (Admin only)
app.put(
  "/api/admin/vendor-applications/:id/review",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      console.log(`📝 Reviewing vendor application ${id} - Status: ${status}`);

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be 'approved' or 'rejected'",
        });
      }

      let updatedApplication = null;

      if (mongoose.connection.readyState === 1) {
        // Find the application
        const application = await VendorApplication.findById(id);

        if (!application) {
          return res.status(404).json({
            success: false,
            message: "Vendor application not found",
          });
        }

        console.log(`📊 Found application for: ${application.userEmail}`);

        // Update application status
        updatedApplication = await VendorApplication.findByIdAndUpdate(
          id,
          {
            status: status,
            reviewNotes: reviewNotes || "",
            reviewedBy: req.mongoUser._id,
            updatedAt: new Date(),
          },
          { new: true }
        );

        // If approved, update user role to vendor
        if (status === "approved") {
          console.log(
            `🔄 Updating user role to vendor for: ${application.userEmail}`
          );

          // Find user by email first
          const userToUpdate = await User.findOne({
            $or: [
              { uid: application.userId },
              { email: application.userEmail },
            ],
          });

          if (userToUpdate) {
            userToUpdate.role = "vendor";
            await userToUpdate.save();
            console.log(`✅ User ${userToUpdate.email} role updated to vendor`);
          } else {
            console.log(
              `⚠️ User not found for application: ${application.userEmail}`
            );
            // Create user if not found
            const newUser = new User({
              uid: application.userId || `vendor-${Date.now()}`,
              email: application.userEmail,
              name: application.contactName || application.userName,
              role: "vendor",
              emailVerified: true,
            });
            await newUser.save();
            console.log(`✅ Created new vendor user: ${application.userEmail}`);
          }
        }

        console.log(`✅ Vendor application ${id} updated to: ${status}`);
      } else {
        // Mock response
        updatedApplication = {
          _id: id,
          status: status,
          reviewNotes: reviewNotes,
          reviewedBy: req.mongoUser._id,
          updatedAt: new Date(),
        };

        console.log(
          "⚠️ Mock: Vendor application would be reviewed if DB connected"
        );
      }

      res.json({
        success: true,
        message: `Vendor application ${status} successfully`,
        data: { application: updatedApplication },
      });
    } catch (error) {
      console.error("Error reviewing vendor application:", error);
      res.status(500).json({
        success: false,
        message: "Error reviewing application",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// ========== DEBUG & UTILITY ROUTES ==========
// Token debugging endpoint
app.post("/api/debug/token-check", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
      });
    }

    const analysis = {
      tokenInfo: {
        length: token.length,
        type: typeof token,
        first50: token.substring(0, 50),
        last50: token.substring(Math.max(0, token.length - 50)),
        hasDots: token.includes("."),
        dotCount: (token.match(/\./g) || []).length,
      },
      isValidJWT: false,
      decoded: null,
    };

    // Try to decode as JWT
    if (token.includes(".") && token.split(".").length === 3) {
      try {
        const parts = token.split(".");
        const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

        analysis.isValidJWT = true;
        analysis.decoded = {
          header,
          payload: {
            ...payload,
            exp_date: payload.exp
              ? new Date(payload.exp * 1000).toISOString()
              : null,
            iat_date: payload.iat
              ? new Date(payload.iat * 1000).toISOString()
              : null,
          },
        };
      } catch (decodeError) {
        analysis.decodeError = decodeError.message;
      }
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
            uid: req.mongoUser.uid,
          },
          authMethod: req.authMethod,
        },
        headers: {
          authorization: req.headers.authorization ? "Present" : "Missing",
        },
        isAdmin: req.mongoUser.role === "admin",
        adminEmailCheck: req.mongoUser.email === "mahdiashan9@gmail.com",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Force make admin endpoint
app.post(
  "/api/debug/make-me-admin",
  firebaseAuthMiddleware,
  async (req, res) => {
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
          data: { user: updatedUser },
        });
      } else {
        res.json({
          success: true,
          message: "Mock: Would make you admin if DB connected",
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

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
        message: `User ${email} not found in MongoDB`,
      });
    }

    // Get all users for debugging
    const allUsers = await User.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        requestedEmail: email,
        foundUser: mongoUser,
        allUsers: allUsers.map((u) => ({
          email: u.email,
          role: u.role,
          uid: u.uid,
          name: u.name,
        })),
        totalUsers: allUsers.length,
      },
    });
  } catch (error) {
    console.error("Error in force sync:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        users: users.map((user) => ({
          _id: user._id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        })),
        count: users.length,
        dbConnected: mongoose.connection.readyState === 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
        { $group: { _id: "$verified", count: { $sum: 1 } } },
      ]);

      stats = {
        totalTickets: await Ticket.countDocuments(),
        approvedTickets: counts.find((c) => c._id === "approved")?.count || 0,
        pendingTickets: counts.find((c) => c._id === "pending")?.count || 0,
        rejectedTickets: counts.find((c) => c._id === "rejected")?.count || 0,
        activeTickets: await Ticket.countDocuments({ isActive: true }),
        futureTickets: await Ticket.countDocuments({
          departureAt: { $gt: new Date() },
        }),
        advertisedTickets: await Ticket.countDocuments({ advertised: true }),
        approvedActive: await Ticket.countDocuments({
          verified: "approved",
          isActive: true,
          departureAt: { $gt: new Date() },
        }),
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
        approvedActive: 0,
      };
    }

    res.json({
      success: true,
      data: {
        allTickets,
        stats,
        dbConnected: mongoose.connection.readyState === 1,
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        data: result,
      });
    } else {
      res.json({
        success: true,
        message: "Mock: All tickets approved (DB not connected)",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
          description: "Premium AC bus service",
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
          description: "Intercity train service",
        },
      ];

      const createdTickets = await Ticket.insertMany(sampleTickets);

      res.json({
        success: true,
        message: `Created ${createdTickets.length} sample tickets`,
        data: createdTickets,
      });
    } else {
      res.json({
        success: true,
        message: "Cannot create tickets - DB not connected",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Test admin access
app.get(
  "/api/debug/test-admin",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    res.json({
      success: true,
      message: "Admin access confirmed!",
      data: {
        user: req.mongoUser.email,
        role: req.mongoUser.role,
        isAdmin: true,
      },
    });
  }
);

// ========== ADMIN ROUTES ==========
// Admin dashboard
app.get(
  "/api/admin/dashboard",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      console.log(
        `📊 Admin dashboard accessed by: ${req.mongoUser.email} (${req.mongoUser.role})`
      );

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
          },
        },
      });
    } catch (error) {
      console.error("Error in admin dashboard:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching dashboard data",
      });
    }
  }
);

// Admin users management
app.get(
  "/api/admin/users",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
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
          { $group: { _id: "$role", count: { $sum: 1 } } },
        ]);

        roleCounts.total = total;
        roleCounts.admins = counts.find((c) => c._id === "admin")?.count || 0;
        roleCounts.vendors = counts.find((c) => c._id === "vendor")?.count || 0;
        roleCounts.regularUsers =
          counts.find((c) => c._id === "user")?.count || 0;
      } else {
        // Mock data
        users = [
          {
            _id: "1",
            uid: "test-admin-id",
            name: "Ashan Mahdi",
            email: "mahdiashan9@gmail.com",
            photoURL:
              "https://ui-avatars.com/api/?name=Ashan+Mahdi&background=random",
            role: "admin",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ].filter((user) => {
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
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching users",
      });
    }
  }
);

// Update user role
app.put(
  "/api/admin/users/:id/role",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
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
            },
          },
        });
      }
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({
        success: false,
        message: "Error updating user role",
      });
    }
  }
);

// Admin tickets management
app.get(
  "/api/admin/tickets",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
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
          { $group: { _id: "$verified", count: { $sum: 1 } } },
        ]);

        stats.total = total;
        stats.pending = counts.find((c) => c._id === "pending")?.count || 0;
        stats.approved = counts.find((c) => c._id === "approved")?.count || 0;
        stats.rejected = counts.find((c) => c._id === "rejected")?.count || 0;
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
          },
        ].filter(
          (ticket) => verified === "all" || ticket.verified === verified
        );

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
        },
      });
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching tickets",
      });
    }
  }
);

// Verify/Reject ticket
app.put(
  "/api/admin/tickets/:id/verify",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
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
            isActive: status === "approved",
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
            },
          },
        });
      }
    } catch (error) {
      console.error("Error verifying ticket:", error);
      res.status(500).json({
        success: false,
        message: "Error updating ticket",
      });
    }
  }
);

// Admin vendor applications
app.get(
  "/api/admin/vendor-applications",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
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
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        stats.total = total;
        stats.pending = counts.find((c) => c._id === "pending")?.count || 0;
        stats.approved = counts.find((c) => c._id === "approved")?.count || 0;
        stats.rejected = counts.find((c) => c._id === "rejected")?.count || 0;
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
          },
        ].filter((app) => status === "all" || app.status === status);

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
        },
      });
    } catch (error) {
      console.error("Error fetching vendor applications:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching applications",
      });
    }
  }
);

// Get single vendor application by ID (Admin)
app.get(
  "/api/admin/vendor-applications/:id",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      let application = null;

      if (mongoose.connection.readyState === 1) {
        application = await VendorApplication.findById(id);

        if (!application) {
          return res.status(404).json({
            success: false,
            message: "Vendor application not found",
          });
        }
      } else {
        // Mock response
        application = {
          _id: id,
          userId: "user123",
          userName: "Test User",
          userEmail: "test@example.com",
          businessName: "Test Business",
          contactName: "Test Contact",
          phone: "+8801712345678",
          businessType: "Travel Agency",
          description: "Test description",
          address: "Test Address",
          status: "pending",
          createdAt: new Date(),
        };
      }

      res.json({
        success: true,
        data: { application },
      });
    } catch (error) {
      console.error("Error fetching vendor application:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching application",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// ========== ADMIN BOOKINGS ENDPOINTS ==========
// GET /api/admin/bookings - Get all bookings for admin panel
app.get(
  "/api/admin/bookings",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      console.log(`📊 Admin bookings accessed by: ${req.mongoUser.email}`);

      const {
        status = "all",
        search = "",
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = req.query;

      // Build filter object
      let filter = {};

      if (status !== "all") {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          { userName: new RegExp(search, "i") },
          { userEmail: new RegExp(search, "i") },
          { bookingReference: new RegExp(search, "i") },
          { ticketTitle: new RegExp(search, "i") },
        ];
      }

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      let bookings = [];
      let total = 0;
      let stats = {
        total: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0,
        totalRevenue: 0,
      };

      if (mongoose.connection.readyState === 1) {
        // Get bookings with pagination
        bookings = await Booking.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum);

        total = await Booking.countDocuments(filter);

        // Get stats by status
        const statusCounts = await Booking.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalRevenue: { $sum: "$totalPrice" },
            },
          },
        ]);

        // Calculate total revenue from confirmed and completed bookings
        const revenueStats = await Booking.aggregate([
          {
            $match: {
              status: { $in: ["confirmed", "completed"] },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalPrice" },
            },
          },
        ]);

        // Initialize stats
        stats.total = total;
        stats.totalRevenue = revenueStats[0]?.totalRevenue || 0;

        // Fill status counts
        statusCounts.forEach((item) => {
          if (item._id === "pending") stats.pending = item.count;
          if (item._id === "confirmed") stats.confirmed = item.count;
          if (item._id === "cancelled") stats.cancelled = item.count;
          if (item._id === "completed") stats.completed = item.count;
        });
      } else {
        // Mock data when DB is not connected
        bookings = [
          {
            _id: "booking-001",
            userId: "user-001",
            userName: "John Doe",
            userEmail: "john@example.com",
            ticketId: {
              _id: "ticket-001",
              title: "Dhaka to Chittagong AC Bus",
              from: "Dhaka",
              to: "Chittagong",
              departureAt: new Date(Date.now() + 86400000),
            },
            ticketTitle: "Dhaka to Chittagong AC Bus",
            quantity: 2,
            totalPrice: 2400,
            status: "pending",
            bookingReference: "BK-20240101-001",
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 86400000),
          },
          {
            _id: "booking-002",
            userId: "user-002",
            userName: "Jane Smith",
            userEmail: "jane@example.com",
            ticketId: {
              _id: "ticket-002",
              title: "Dhaka to Sylhet Train",
              from: "Dhaka",
              to: "Sylhet",
              departureAt: new Date(Date.now() + 172800000),
            },
            ticketTitle: "Dhaka to Sylhet Train",
            quantity: 1,
            totalPrice: 1800,
            status: "confirmed",
            bookingReference: "BK-20240101-002",
            createdAt: new Date(Date.now() - 43200000),
            updatedAt: new Date(Date.now() - 43200000),
          },
        ];

        total = bookings.length;
        stats = {
          total: 2,
          pending: 1,
          confirmed: 1,
          cancelled: 0,
          completed: 0,
          totalRevenue: 4200,
        };
      }

      res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
          stats,
        },
      });
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching bookings",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// PUT /api/admin/bookings/:id/status - Update booking status
app.put(
  "/api/admin/bookings/:id/status",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      console.log(`📝 Updating booking ${id} status to: ${status}`);

      if (
        !["pending", "confirmed", "cancelled", "completed"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status. Must be: pending, confirmed, cancelled, or completed",
        });
      }

      let updatedBooking = null;

      if (mongoose.connection.readyState === 1) {
        // Find and update booking
        updatedBooking = await Booking.findByIdAndUpdate(
          id,
          {
            status: status,
            updatedAt: new Date(),
          },
          { new: true }
        );

        if (!updatedBooking) {
          return res.status(404).json({
            success: false,
            message: "Booking not found",
          });
        }

        console.log(`✅ Booking ${id} updated to: ${status}`);

        // If confirming booking, reduce available quantity on ticket
        if (status === "confirmed" && updatedBooking.ticketId) {
          const ticket = await Ticket.findById(updatedBooking.ticketId);
          if (ticket) {
            const newAvailable = Math.max(
              0,
              ticket.availableQuantity - updatedBooking.quantity
            );
            ticket.availableQuantity = newAvailable;
            await ticket.save();
            console.log(
              `✅ Reduced available quantity for ticket ${ticket._id} to ${newAvailable}`
            );
          }
        }

        // If cancelling a confirmed booking, restore ticket quantity
        if (status === "cancelled" && updatedBooking.ticketId) {
          const previousBooking = await Booking.findById(id);
          if (previousBooking && previousBooking.status === "confirmed") {
            const ticket = await Ticket.findById(updatedBooking.ticketId);
            if (ticket) {
              ticket.availableQuantity = Math.min(
                ticket.quantity,
                ticket.availableQuantity + previousBooking.quantity
              );
              await ticket.save();
              console.log(`✅ Restored quantity for ticket ${ticket._id}`);
            }
          }
        }
      } else {
        // Mock response
        updatedBooking = {
          _id: id,
          status: status,
          updatedAt: new Date(),
        };

        console.log("⚠️ Mock: Booking would be updated if DB connected");
      }

      res.json({
        success: true,
        message: `Booking status updated to ${status}`,
        data: { booking: updatedBooking },
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({
        success: false,
        message: "Error updating booking status",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// GET /api/admin/bookings/:id - Get single booking details
app.get(
  "/api/admin/bookings/:id",
  firebaseAuthMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      let booking = null;

      if (mongoose.connection.readyState === 1) {
        booking = await Booking.findById(id).populate(
          "ticketId",
          "title from to departureAt transportType price vendorName"
        );

        if (!booking) {
          return res.status(404).json({
            success: false,
            message: "Booking not found",
          });
        }
      } else {
        // Mock data
        booking = {
          _id: id,
          userId: "user-001",
          userName: "John Doe",
          userEmail: "john@example.com",
          ticketId: {
            _id: "ticket-001",
            title: "Dhaka to Chittagong AC Bus",
            from: "Dhaka",
            to: "Chittagong",
            transportType: "bus",
            price: 1200,
            vendorName: "Travel Express",
            departureAt: new Date(Date.now() + 86400000),
          },
          ticketTitle: "Dhaka to Chittagong AC Bus",
          quantity: 2,
          totalPrice: 2400,
          status: "pending",
          bookingReference: "BK-20240101-001",
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
        };
      }

      res.json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      console.error("Error fetching booking details:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching booking",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// ========= ERROR HANDLERS =========
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

// ========== EXPORT FOR VERCEL ==========
module.exports = app;

// ========== LOCAL DEVELOPMENT SERVER START ==========
// Only start the server if we're not in a Vercel environment
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log("=".repeat(70));
    console.log("🚀 TICKETBARI BACKEND SERVER STARTED (Local Development)");
    console.log("=".repeat(70));
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(
      `🔐 Auth Mode: ${
        firebaseInitialized ? "Firebase Admin" : "Mock Authentication"
      }`
    );
    console.log(
      `🗄️  Database: ${
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
      }`
    );
    console.log(`👑 Admin Email: mahdiashan9@gmail.com`);
    console.log("=".repeat(70));
  });
}