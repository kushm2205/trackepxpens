import { Document, model, Schema } from "mongoose";

export interface IExpense extends Document {
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "food",
        "transportation",
        "housing",
        "entertainment",
        "utilities",
        "healthcare",
        "shopping",
        "other",
      ],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "credit card", "debit card", "bank transfer", "other"],
    },
  },
  {
    timestamps: true,
  }
);

export default model<IExpense>("Expense", ExpenseSchema);
