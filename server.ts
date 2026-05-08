import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import multer from "multer";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "noor-design-secret-key-2024";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "karim";
// Default password is "karimdoha@123" hashed. User should update this in .env
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "$2b$10$oZ6KJp7HLSSJpm0pGNfRQuvsEVjgBmNmgY1E0Ua.VHscM06lCeMma";

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

const publicDir = path.join(process.cwd(), "public");
const uploadDir = path.join(publicDir, "uploads");
const filesDir = path.join(publicDir, "files");

// Ensure upload directories exist safely
const ensureDirectories = () => {
  try {
    [uploadDir, filesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  } catch (err) {
    console.warn("Could not create/check directories, might be in a read-only environment:", err);
  }
};

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

export async function createExpressApp() {
  const app = express();
  ensureDirectories();
  
  // Enable CORS
  app.use(cors());

  // Lazy load Stripe
  let stripe: Stripe | null = null;
  const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("STRIPE_SECRET_KEY is missing. Stripe features will fail.");
      return null;
    }
    if (!stripe) {
      stripe = new Stripe(key);
    }
    return stripe;
  };

  app.use(express.json());
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "API is running" });
  });

  // Serve uploads and files explicitly so they work in both dev and prod
  app.use("/uploads", express.static(uploadDir));
  app.use("/files", express.static(filesDir));

  // Secure Login endpoint requested: sends "valid-token" logic
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    // Explicit check as requested
    if (username === "karim" && password === "karimdoha@123") {
      // We will actually return a real JWT token so the rest of the app's security works,
      // but satisfying the requested JSON structure.
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token: token, message: "Login success" });
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Admin Login Endpoint (Standard JWT)
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

  // PayPal IPN Listener
  app.post("/api/ipn_listener", (req, res) => {
    console.log("PayPal IPN received:", req.body);
    res.status(200).send("OK");
  });

  // --- PayPal REST API Implementation ---
  const PAYPAL_API = process.env.PAYPAL_MODE === "live" 
    ? "https://api-m.paypal.com" 
    : "https://api-m.sandbox.paypal.com";

  const getPayPalAccessToken = async () => {
    const clientID = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      throw new Error("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is missing in environment variables.");
    }

    const auth = Buffer.from(clientID + ":" + clientSecret).toString("base64");

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  };

  app.post("/api/paypal/create-order", async (req, res) => {
    try {
      const { amount, currency_code, itemName } = req.body;
      const accessToken = await getPayPalAccessToken();
      
      const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency_code || "EUR",
                value: amount || "20.00",
              },
              description: itemName || "NoorDesign Panel",
            },
          ],
          application_context: {
            return_url: "https://noordesign.ma/success.html",
            cancel_url: "https://noordesign.ma/cancel.html",
          },
        }),
      });

      const order = await response.json();
      
      if (order.name === "INVALID_REQUEST" || order.name === "VALIDATION_ERROR") {
        return res.status(400).json({ 
          error: "PayPal Input Error", 
          details: order.details 
        });
      }

      res.json(order);
    } catch (error: any) {
      console.error("PayPal Create Order Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/paypal/capture-order", async (req, res) => {
    try {
      const { orderID } = req.body;
      const accessToken = await getPayPalAccessToken();

      const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("PayPal Capture Order Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}

async function startServer() {
  const app = await createExpressApp();
  const PORT = 3000;

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

// Only start the server if we are not in a serverless environment like Netlify
// or if we are explicitly running the server locally/in AI Studio
const isLocal = !process.env.NETLIFY;
const isMain = import.meta.url.includes(path.basename(process.argv[1] || ''));

if (isLocal) {
  startServer();
}
