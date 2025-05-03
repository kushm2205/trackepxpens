import mongoose, { Schema, Document } from "mongoose";

interface IOtp extends Document {
  email: string;
  otp: Number;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true },
  otp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const Otp = mongoose.model<IOtp>("Otp", OtpSchema);
export default Otp;
