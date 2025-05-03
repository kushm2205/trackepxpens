import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import otpRoutes from "./Router/otproutes";
import bodyParser from "body-parser";
import * as admin from "firebase-admin";
import notificationRoutes from "./Router/notificationRoutes";
import dotenv from "dotenv";

dotenv.config();

const app = express();

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
  console.log("Firebase database connection success");
} catch (err) {
  console.log("Firebase initialization error:", err);
}

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

connectDB();

app.use("/api", otpRoutes);
app.use("/", notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
