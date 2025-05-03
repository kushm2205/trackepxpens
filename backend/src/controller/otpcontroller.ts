import { Request, Response } from "express";
import Otp from "../models/otp";
import transporter from "../config/mailer";

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const new1 = await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log("===================================");
    console.log(new1);
    console.log("====================================");
    console.log(`Generated OTP for ${email}: ${otp}`);

    const mailOptions = {
      from: "kushp2224@gmail.com",
      to: email,
      subject: "Your Verification Code",
      text: `Your OTP code is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP", error });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ message: "Email and OTP are required" });
    return;
  }

  try {
    const storedOtp = await Otp.findOne({ email });

    if (!storedOtp) {
      res.status(400).json({ message: "OTP not found or expired" });
      return;
    }

    if (storedOtp.otp === otp) {
      await Otp.deleteOne({ email });
      res.status(200).json({ message: "OTP verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error" });
  }
};
