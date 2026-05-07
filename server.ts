import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Image Upload Endpoint
  app.post("/api/upload-image", uploadImg.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    res.json({ filePath: `/uploads/${req.file.filename}` });
  });

  // STL/General File Upload Endpoint
  app.post("/api/upload-file", uploadFile.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ filePath: `/files/${req.file.filename}` });
  });

  // STL Upload (Backward Compatibility)
  app.post("/api/upload-stl", uploadFile.single("stlFile"), (req, res) => {
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
