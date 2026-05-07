import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import multer from "multer";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "noor-design-secret-key-2024";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
// Default password is "admin123" hashed. User should update this in .env
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "$2a$10$zR8V0lR.w6kCgJqR/fRjR.rZ3X9ZlX9ZlX9ZlX9ZlX9ZlX9ZlX9Zl";

// Middleware to authenticate JWT
interface AuthRequest extends Request {
  user?: any;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// Ensure upload directories exist
const publicDir = path.join(process.cwd(), "public");
const uploadDir = path.join(publicDir, "uploads");
const filesDir = path.join(publicDir, "files");

[uploadDir, filesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer config for images
const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

// Multer config for files (STL, etc)
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, filesDir),
  filename: (req, file, cb) => {
    // Keep original name for user convenience or make it unique
    cb(null, file.originalname);
  }
});

const uploadImg = multer({ storage: imgStorage });
const uploadFile = multer({ storage: fileStorage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Lazy load Stripe
  let stripe: Stripe | null = null;
  const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      // In development, handle missing key gracefully or use a placeholder
      // For this app, we'll inform the user if it's missing on first use
      console.warn("STRIPE_SECRET_KEY is missing. Stripe features will fail.");
      return null;
    }
    if (!stripe) {
      stripe = new Stripe(key);
    }
    return stripe;
  };

  app.use(express.json());

  // Admin Login Endpoint
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;

    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    try {
      const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Verify Token Endpoint
  app.get("/api/admin/verify", authenticateToken, (req, res) => {
    res.json({ valid: true });
  });

  // Image Upload Endpoint (Protected)
  app.post("/api/upload-image", authenticateToken, uploadImg.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    res.json({ filePath: `/uploads/${req.file.filename}` });
  });

  // STL/General File Upload Endpoint (Protected)
  app.post("/api/upload-file", authenticateToken, uploadFile.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ filePath: `/files/${req.file.filename}` });
  });

  // STL Upload (Backward Compatibility) (Protected)
  app.post("/api/upload-stl", authenticateToken, uploadFile.single("stlFile"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ filePath: `/files/${req.file.filename}` });
  });

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId, productName, stlFilePath, successUrl, cancelUrl, category } = req.body;
    const stripeClient = getStripe();

    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment." });
    }

    try {
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: cancelUrl,
        metadata: {
          productName,
          stlFilePath,
          category,
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe session error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/verify-session", async (req, res) => {
    const { sessionId } = req.query;
    const stripeClient = getStripe();

    if (!stripeClient || !sessionId) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const session = await stripeClient.checkout.sessions.retrieve(sessionId as string);
      if (session.payment_status === "paid") {
        res.json({ 
          status: "paid", 
          productName: session.metadata?.productName,
          downloadUrl: session.metadata?.stlFilePath,
          category: session.metadata?.category
        });
      } else {
        res.json({ status: "unpaid" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Redirect success.html and cancel.html to the SPA routes
  app.get("/success.html", (req, res) => {
    res.redirect("/success" + (req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : ""));
  });

  app.get("/cancel.html", (req, res) => {
    res.redirect("/cancel");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
