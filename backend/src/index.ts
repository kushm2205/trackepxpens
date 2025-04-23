import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import connectDB from "./config/db";
import otpRoutes from "./Router/otproutes";
import bodyParser from "body-parser";
const admin = require("./firebase");
const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
const db = admin.firestore();
connectDB();

app.use("/api", otpRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
