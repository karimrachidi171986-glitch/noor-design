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
import helmet from "helmet";
import DOMPurify from "isomorphic-dompurify";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

dotenv.config();

// Cloudinary Configuration
const useCloudinary = process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (useCloudinary) {
  if (process.env.CLOUDINARY_URL) {
    // Already configured via URL
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
}

// Sanitization helper
const sanitize = (input: any, key?: string): any => {
  // Skip sensitive fields that might have special characters (liike passwords)
  if (key === "password" || key === "token") return input;

  if (typeof input === "string") {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitize(item));
  }
  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
    for (const k in input) {
      sanitized[k] = sanitize(input[k], k);
    }
    return sanitized;
  }
  return input;
};

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
    if (err) return res.status(401).json({ error: "Forbidden: Token invalide ou expiré" });
    req.user = user;
    next();
  });
};

const publicDir = path.join(process.cwd(), "public");
// On Netlify, we can only safely write to /tmp
const uploadDir = process.env.NETLIFY ? "/tmp/uploads" : path.join(publicDir, "uploads");
const filesDir = process.env.NETLIFY ? "/tmp/files" : path.join(publicDir, "files");

// Ensure upload directories exist safely
const ensureDirectories = () => {
  if (useCloudinary) return; // No need for local dirs if using Cloudinary
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

// Multer config
// For Netlify/Cloudinary, we use memory storage
const storage = useCloudinary ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    cb(null, isImage ? uploadDir : filesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const imgFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format de fichier non supporté. Seuls JPG, PNG, WEBP et GIF sont acceptés."), false);
  }
};

const uploadImg = multer({ 
  storage,
  fileFilter: imgFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadFile = multer({ storage });

export async function createExpressApp() {
  const app = express();
  if (!useCloudinary) ensureDirectories();
  
  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://connect.facebook.net", "https://www.paypal.com", "https://www.googletagmanager.com", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://www.facebook.com", "https://instagram.fcmn1-1.fna.fbcdn.net", "https://images.unsplash.com", "https://www.paypalobjects.com", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://www.paypal.com", "https://www.google-analytics.com", "https://stats.g.doubleclick.net", "https://api.stripe.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false,
  }));
  
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
  
  // Sanitization Middleware
  app.use((req, res, next) => {
    if (req.body && req.path !== "/api/stripe-webhook") {
      req.body = sanitize(req.body);
    }
    next();
  });
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      mode: process.env.NETLIFY ? "serverless" : "standard",
      storage: useCloudinary ? "cloudinary" : "local"
    });
  });

  // Serve uploads and files explicitly
  app.use("/uploads", express.static(uploadDir));
  app.use("/files", express.static(filesDir));

  // Admin Login
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    if (username === "karim" && (password === "karimdoha@123" || (ADMIN_PASSWORD_HASH && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)))) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, message: "Login success" });
    } else {
      return res.status(401).json({ error: "Identifiants invalides" });
    }
  });

  // Image Upload Endpoint
  app.post("/api/upload-image", authenticateToken, (req, res) => {
    uploadImg.single("image")(req, res, async (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Aucune image téléchargée" });
      }

      if (useCloudinary) {
        try {
          const uploadFromBuffer = (fileBuffer: Buffer) => {
            return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "noor-design/products" },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              streamifier.createReadStream(fileBuffer).pipe(uploadStream);
            });
          };

          const result: any = await uploadFromBuffer(req.file.buffer);
          return res.json({ filePath: result.secure_url });
        } catch (uploadErr: any) {
          console.error("Cloudinary Error:", uploadErr);
          return res.status(500).json({ error: "Erreur lors de l'envoi vers Cloudinary: " + uploadErr.message });
        }
      } else {
        res.json({ filePath: `/uploads/${req.file.filename}` });
      }
    });
  });

  // STL/General File Upload
  app.post("/api/upload-file", authenticateToken, (req, res) => {
    uploadFile.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      if (useCloudinary) {
        try {
          const uploadFromBuffer = (fileBuffer: Buffer, fileName: string) => {
            return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { 
                  folder: "noor-design/files",
                  resource_type: "raw", // important for non-image files
                  public_id: fileName
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              streamifier.createReadStream(fileBuffer).pipe(uploadStream);
            });
          };

          const result: any = await uploadFromBuffer(req.file.buffer, req.file.originalname);
          return res.json({ filePath: result.secure_url });
        } catch (uploadErr: any) {
          console.error("Cloudinary Error (File):", uploadErr);
          return res.status(500).json({ error: uploadErr.message });
        }
      } else {
        res.json({ filePath: `/files/${req.file.filename}` });
      }
    });
  });

  // Backward compatibility alias for /api/upload-stl
  app.post("/api/upload-stl", authenticateToken, (req, res) => {
    res.redirect(307, "/api/upload-file");
  });

  // Stripe Checkout
  app.post("/api/create-checkout-session", async (req, res) => {
    const { productId, productName, productPrice, stlFilePath, category } = req.body;
    const stripeClient = getStripe();

    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe integration is not configured." });
    }

    try {
      const origin = req.headers.origin || "https://noordesign.ma";
      const numericPrice = parseFloat(productPrice.replace(/[^0-9.]/g, '')) || 20.00;
      
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: productName,
                description: `Achat de ${productName} - Noor Design`,
              },
              unit_amount: Math.round(numericPrice * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(productName)}&category=${category}&downloadUrl=${encodeURIComponent(stlFilePath || '')}`,
        cancel_url: `${origin}/cancel`,
        metadata: {
          productId,
          productName,
          stlFilePath: stlFilePath || "",
          category,
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe session error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // PayPal REST API
  const PAYPAL_API = process.env.PAYPAL_MODE === "live" 
    ? "https://api-m.paypal.com" 
    : "https://api-m.sandbox.paypal.com";

  const getPayPalAccessToken = async () => {
    const clientID = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      throw new Error("PayPal credentials missing.");
    }

    const auth = Buffer.from(clientID + ":" + clientSecret).toString("base64");

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: { Authorization: `Basic ${auth}` },
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
        }),
      });

      const order = await response.json();
      res.json(order);
    } catch (error: any) {
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
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}

async function startServer() {
  const app = await createExpressApp();
  const PORT = 3000;

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

const isLocal = !process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT;

if (isLocal) {
  startServer();
}
