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

dotenv.config();

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

const imgFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format de fichier non supporté. Seuls JPG, PNG, WEBP et GIF sont acceptés."), false);
  }
};

// Multer config for files (STL, etc)
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, filesDir),
  filename: (req, file, cb) => {
    // Keep original name for user convenience or make it unique
    cb(null, file.originalname);
  }
});

const uploadImg = multer({ 
  storage: imgStorage,
  fileFilter: imgFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const uploadFile = multer({ storage: fileStorage });

export async function createExpressApp() {
  const app = express();
  ensureDirectories();
  
  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://connect.facebook.net", "https://www.paypal.com", "https://www.googletagmanager.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://www.facebook.com", "https://instagram.fcmn1-1.fna.fbcdn.net", "https://images.unsplash.com", "https://www.paypalobjects.com"],
        connectSrc: ["'self'", "https://www.paypal.com", "https://www.google-analytics.com", "https://stats.g.doubleclick.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false, // Often blocks external images if not configured
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
    
    // Check if key is test or live based on prefix as requested
    const isTest = key.startsWith("sk_test");
    if (isTest) {
      console.log("Stripe standard: Sandbox/Test mode detected");
    } else if (key.startsWith("sk_live")) {
      console.log("Stripe standard: Live/Production mode detected");
    }

    if (!stripe) {
      stripe = new Stripe(key);
    }
    return stripe;
  };

  app.use(express.json());
  
  // Sanitization Middleware
  app.use((req, res, next) => {
    // Skip sanitization for stripe webhooks or specific paths if needed, 
    // but here we just sanitize bodies for general API safety.
    if (req.body && req.path !== "/api/stripe-webhook") {
      req.body = sanitize(req.body);
    }
    next();
  });
  
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
  app.post("/api/upload-image", authenticateToken, (req, res) => {
    uploadImg.single("image")(req, res, (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: `Erreur de téléchargement: ${err.message}` });
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Aucune image téléchargée" });
      }

      console.log("Image uploaded successfully:", req.file.filename);
      res.json({ filePath: `/uploads/${req.file.filename}` });
    });
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
    const { productId, productName, productPrice, stlFilePath, category } = req.body;
    const stripeClient = getStripe();

    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe integration is not configured. Please add STRIPE_SECRET_KEY." });
    }

    try {
      const origin = req.headers.origin || "noordesign.ma";
      
      // Clean up price (remove non-numeric chars)
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
              unit_amount: Math.round(numericPrice * 100), // convert to cents
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

  // Alias for /create-checkout-session as specifically requested
  app.post("/create-checkout-session", (req, res) => {
    res.redirect(307, "/api/create-checkout-session");
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

  // Modern Checkout flow routes
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
            return_url: "https://noordesign.ma/admin-dashboard", // As requested to redirect to dashboard if needed
            cancel_url: "https://noordesign.ma/catalogue",
          },
        }),
      });

      const order = await response.json();
      res.json(order);
    } catch (error: any) {
      console.error("PayPal Create Order Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Alias for /pay as requested
  app.post("/api/pay", (req, res) => {
    // Redirect to create-order logic
    res.redirect(307, "/api/paypal/create-order");
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

  // Simple feedback routes
  app.get("/api/paypal/success-feedback", (req, res) => {
    res.json({ message: "✅ Paiement réussi" });
  });

  app.get("/api/paypal/cancel-feedback", (req, res) => {
    res.json({ message: "❌ Paiement annulé" });
  });

  // --- CMI Payment (Moroccan Local Gateway) ---
  app.post("/api/cmi/pay", (req, res) => {
    const { amount, productName, oid } = req.body;
    const merchantId = process.env.CMI_MERCHANT_ID;
    const secretKey = process.env.CMI_SECRET_KEY;
    const mode = process.env.CMI_MODE || "sandbox";
    
    if (!merchantId || !secretKey) {
      return res.status(500).json({ error: "CMI is not configured. Please add CMI_MERCHANT_ID and CMI_SECRET_KEY." });
    }

    const gatewayUrl = mode === "live" 
      ? "https://payment.cmi.co.ma/fim/est3Dgate" 
      : "https://testpayment.cmi.co.ma/fim/est3Dgate";

    const origin = req.headers.origin || "https://noordesign.ma";
    const orderId = oid || `ORD-${Date.now()}`;
    
    const params: any = {
      clientid: merchantId,
      amount: amount || "20.00",
      currency: "504", // MAD
      oid: orderId,
      okUrl: `${origin}/success?payment=cmi&orderId=${orderId}`,
      failUrl: `${origin}/cancel?payment=cmi&orderId=${orderId}`,
      lang: "fr",
      email: "contact@noordesign.ma",
      BillToName: "Client Noor Design",
      storetype: "3D_PAY_HOSTING",
      tranType: "PreAuth",
      callbackUrl: `${origin}/api/cmi/callback`,
      encoding: "UTF-8",
      hashAlgorithm: "ver3",
      shopurl: origin
    };

    // Calculate Hash (CMI spec usually requires SHA-512)
    // Sort parameters alphabetically (excluding hash)
    const sortedKeys = Object.keys(params).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    let hashStr = "";
    sortedKeys.forEach(key => {
      let val = params[key].toString().replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
      hashStr += val + "|";
    });
    hashStr += secretKey;

    const hash = crypto.createHash("sha512").update(hashStr, "utf-8").digest("base64");
    params.hash = hash;

    res.json({
      url: gatewayUrl,
      params: params
    });
  });

  app.post("/api/cmi/callback", (req, res) => {
    console.log("CMI Callback received:", req.body);
    // Here you would verify the callback hash as well if needed
    res.send("ACTION=POSTAUTH");
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
