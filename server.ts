import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import DOMPurify from "isomorphic-dompurify";

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

const JWT_SECRET = process.env.JWT_SECRET || "noor-design-secret-key-2024";
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

export async function createExpressApp() {
  const app = express();
  
  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://connect.facebook.net", "https://www.paypal.com", "https://www.googletagmanager.com", "https://js.stripe.com", "https://*.supabase.co"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://www.facebook.com", "https://instagram.fcmn1-1.fna.fbcdn.net", "https://images.unsplash.com", "https://www.paypalobjects.com", "https://res.cloudinary.com", "https://*.supabase.co"],
        connectSrc: ["'self'", "https://www.paypal.com", "https://www.google-analytics.com", "https://stats.g.doubleclick.net", "https://api.stripe.com", "https://*.supabase.co", "wss://*.supabase.co"],
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

  // Detailed Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

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
  
  // Create API Router
  const apiRouter = express.Router();

  // Sanitization Middleware for the router
  apiRouter.use((req, res, next) => {
    if (req.body && req.path !== "/stripe-webhook") {
      req.body = sanitize(req.body);
    }
    next();
  });
  
  // Health check
  apiRouter.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      mode: process.env.NETLIFY ? "serverless" : "standard",
      storage: "supabase",
      time: new Date().toISOString()
    });
  });

  // Admin Login
  apiRouter.post("/login", (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log(`Login attempt for user: ${username}`);
      
      const isValidUser = username === "karim";
      const isValidPass = (password === "karimdoha@123" || (ADMIN_PASSWORD_HASH && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)));

      if (isValidUser && isValidPass) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        console.log("Login success");
        return res.json({ token, message: "Login success" });
      } else {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ error: "Identifiants invalides" });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Erreur interne du serveur lors de la connexion" });
    }
  });

  // Admin Token Verification
  apiRouter.get("/admin/verify", authenticateToken, (req: AuthRequest, res: Response) => {
    res.json({ valid: true, user: (req as any).user });
  });

  // Stripe Checkout
  apiRouter.post("/create-checkout-session", async (req, res) => {
    const { productId, productName, productPrice, stlFilePath, category } = req.body;
    const stripeClient = getStripe();

    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe integration is not configured." });
    }

    try {
      const origin = req.headers.origin || "https://noordesign.ma";
      const numericPrice = parseFloat(productPrice.replace(',', '.').replace(/[^0-9.]/g, '')) || 20.00;
      
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

  apiRouter.post("/paypal/create-order", async (req, res) => {
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

  apiRouter.post("/paypal/capture-order", async (req, res) => {
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

  // Mount API Router
  app.use("/api", apiRouter);
  
  // Also mount without /api prefix for Netlify functions if split
  app.use("/.netlify/functions/api", apiRouter);

  // Serve static files if they exist (backward compatibility)
  app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
  app.use("/files", express.static(path.join(process.cwd(), "public/files")));

// In Express v4, use app.get('*', but in Express v5, you must use app.get('*all',
  
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
    console.log("Vite middleware loaded");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static serving loaded");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Start the server
startServer();
