# Admin Panel Guide

This project now includes a secure admin panel built with React, Node.js, Express, and JWT.

## 🚀 How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file (or use the provided `.env.example`) and set your secrets:
   ```env
   JWT_SECRET=your_secret_key_here
   ADMIN_USERNAME=karim
   ADMIN_PASSWORD_HASH=$2b$10$oZ6KJp7HLSSJpm0pGNfRQuvsEVjgBmNmgY1E0Ua.VHscM06lCeMma
   ```
   *(The provided hash corresponds to the password `karimdoha@123`)*

3. **Start the Server:**
   ```bash
   npm run dev
   ```

## 🧪 How to Test the Login

1. Open your browser and navigate to `/admin` (e.g., `http://localhost:3000/admin`).
2. You will see the **Accès Administrateur** login form.
3. Enter the credentials:
   - **Username:** `karim`
   - **Password:** `karimdoha@123`
4. Upon successful login, you will be redirected to the homepage.
5. A "Déconnexion Admin" button will appear in the top-right corner.
6. You will now see edit/upload controls on the product catalogue that are hidden from regular visitors.

## ☁️ How to Deploy to Netlify

1.  **Connect to GitHub:** Push your code to a GitHub repository.
2.  **Create a New Site on Netlify:** Link it to your GitHub repo.
3.  **Config in `netlify.toml` (Already Included):**
    -   **Build Command:** `npm run build`
    -   **Publish Directory:** `dist`
    -   **Functions Directory:** `netlify/functions`
4.  **Set Environment Variables:**
    In the Netlify dashboard (Site settings > Environment variables), add:
    -   `JWT_SECRET`
    -   `ADMIN_USERNAME`
    -   `ADMIN_PASSWORD_HASH`
    -   `STRIPE_SECRET_KEY` (if using payments)
5.  **Enjoy:** Netlify will automatically build your React frontend and deploy your Node.js backend as a Netlify Function. The redirect from `/api/*` to your function is already configured in `netlify.toml`.

*(Note: File uploads use `multer` with local storage in this demo. For production Netlify deployments, you should use a cloud storage provider like AWS S3 or Cloudinary, as Netlify Functions have a read-only file system and temporary execution environment.)*

- **JWT Authentication:** Tokens expire in 24 hours. They are stored in `localStorage` and sent in the `Authorization` header for API requests.
- **Bcrypt Hashing:** Passwords are never stored in plain text.
- **Route Protection:**
  - **Frontend:** The `/admin` route is guarded by a check to the backend.
  - **Backend:** Middleware verifies the JWT before allowing file uploads or sensitive operations.
- **No Hardcoded Secrets:** Credentials and secrets are managed via environment variables (with secure defaults for this demo).
