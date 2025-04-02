import mongoose, { Schema, Document } from "mongoose";

// Define OTP document interface
interface IOtp extends Document {
  email: string;
  otp: Number;
  createdAt: Date;
}

// Define OTP schema with automatic expiration (TTL index)
const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true },
  otp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // Expires in 5 minutes (300 seconds)
});

// Create OTP model
const Otp = mongoose.model<IOtp>("Otp", OtpSchema);
export default Otp;
