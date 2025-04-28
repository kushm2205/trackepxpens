import express from "express";
import {
  sendExpenseNotification,
  sendGroupExpenseNotification,
} from "../controller/notificationcontroller";

const router = express.Router();

router.post("/send-expense-notification", sendExpenseNotification);
router.post("/send-group-expense-notification", sendGroupExpenseNotification);

export default router;
