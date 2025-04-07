import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import connectDB from "./db";
import Otp from "./models/otp";

const app = express();
app.use(express.json());
app.use(cors());

connectDB(); // Connect to MongoDB

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kushp2224@gmail.com", // Replace with your email
    pass: "ptxn kpaf caul zjdf", // Use an App Password (not your real password)
  },
});

// API to send OTP via Email
app.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  console.log("otp");
  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP

  try {
    // Save OTP to database (replaces previous OTP for the same email)
    await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`Generated OTP for ${email}: ${otp}`); // Debugging log

    const mailOptions = {
      from: "kushp2224@gmail.com",
      to: email,
      subject: "Your Verification Code",
      text: `Your OTP code is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });
    return;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return;
    res.status(500).json({ message: "Error sending OTP", error });
  }
});

// API to verify OTP
app.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({ message: "Email and OTP are required" });
    return;
  }

  try {
    const storedOtp = await Otp.findOne({ email });
    console.log(typeof otp);
    if (storedOtp && storedOtp.otp === otp) {
      await Otp.deleteOne({ email }); // Remove OTP after successful verification
      res.status(200).json({ message: "OTP verified successfully" });
      return;
    } else {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));
