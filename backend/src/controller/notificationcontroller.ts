import * as admin from "firebase-admin";
import { Request, Response } from "express";

interface NotificationRequest {
  payerId: string;
  friendId: string;
  expenseId: string;
  description: string;
  amount: number;
}

export const sendExpenseNotification = async (req: Request, res: Response) => {
  try {
    const {
      payerId,
      friendId,
      expenseId,
      description,
      amount,
    }: NotificationRequest = req.body;

    console.log("Expense notification request:", {
      payerId,
      friendId,
      expenseId,
      description,
      amount,
    });

    if (!payerId || !friendId || !description) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const friendDoc = await admin
      .firestore()
      .collection("users")
      .doc(friendId)
      .get();

    if (!friendDoc.exists) {
      console.log(`Friend not found: ${friendId}`);
      res.status(404).json({ error: "Friend not found" });
      return;
    }

    const friendData = friendDoc.data();

    if (!friendData?.fcmToken) {
      console.log(`Friend has no FCM token: ${friendId}`);
      res.status(400).json({ error: "Friend has no FCM token" });
      return;
    }

    const payerDoc = await admin
      .firestore()
      .collection("users")
      .doc(payerId)
      .get();
    const payerData = payerDoc.exists ? payerDoc.data() : null;
    const payerName = payerData?.name || "Someone";

    console.log(`Sending notification to token: ${friendData.fcmToken}`);

    const payload: admin.messaging.Message = {
      token: friendData.fcmToken,
      notification: {
        title: "New Expense Added",
        body: `${payerName} added an expense: ${description} - ₹${amount}`,
      },
      data: {
        type: "NEW_EXPENSE",
        expenseId,
        payerId,
        friendId,
        description,
        amount: amount.toString(),
        timestamp: new Date().toISOString(),
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: {
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          channelId: "expenses",
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };

    const response = await admin.messaging().send(payload);
    console.log("Successfully sent notification:", response);

    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      error: "Failed to send notification",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const sendGroupExpenseNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      payerId,
      groupId,
      expenseId,
      description,
      amount,
    }: {
      payerId: string;
      groupId: string;
      expenseId: string;
      description: string;
      amount: number;
    } = req.body;

    console.log("Group expense notification request:", {
      payerId,
      groupId,
      expenseId,
      description,
      amount,
    });

    if (!payerId || !groupId || !description) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const groupDoc = await admin
      .firestore()
      .collection("groups")
      .doc(groupId)
      .get();
    if (!groupDoc.exists) {
      console.log(`Group not found: ${groupId}`);
      res.status(404).json({ error: "Group not found" });
      return;
    }

    const groupData = groupDoc.data();
    const members: string[] = groupData?.members || [];

    if (!members.length) {
      console.log(`No members in group: ${groupId}`);
      res.status(400).json({ error: "No members in group" });
      return;
    }

    const payerDoc = await admin
      .firestore()
      .collection("users")
      .doc(payerId)
      .get();
    const payerData = payerDoc.exists ? payerDoc.data() : null;
    const payerName = payerData?.name || "Someone";

    const sendResults: {
      memberId: string;
      status: string;
      error?: string;
    }[] = [];

    for (const memberId of members) {
      if (memberId === payerId) continue;

      try {
        const memberDoc = await admin
          .firestore()
          .collection("users")
          .doc(memberId)
          .get();
        if (!memberDoc.exists) {
          console.log(`Member not found: ${memberId}`);
          sendResults.push({
            memberId,
            status: "failed",
            error: "Member not found",
          });
          continue;
        }

        const memberData = memberDoc.data();
        if (!memberData?.fcmToken) {
          console.log(`Member has no FCM token: ${memberId}`);
          sendResults.push({
            memberId,
            status: "failed",
            error: "No FCM token",
          });
          continue;
        }

        console.log(`Sending notification to token: ${memberData.fcmToken}`);

        const payload: admin.messaging.Message = {
          token: memberData.fcmToken,
          notification: {
            title: `New Expenses added`,
            body: `${payerName} added an expense: ${description} - ₹${amount}`,
          },
          data: {
            type: "NEW_GROUP_EXPENSE",
            expenseId,
            payerId,
            groupId,
            description,
            amount: amount.toString(),
            timestamp: new Date().toISOString(),
            click_action: "FLUTTER_NOTIFICATION_CLICK",
          },
          android: {
            priority: "high",
            notification: {
              clickAction: "FLUTTER_NOTIFICATION_CLICK",
              channelId: "expenses",
            },
          },
          apns: {
            payload: {
              aps: {
                contentAvailable: true,
              },
            },
          },
        };

        const response = await admin.messaging().send(payload);
        console.log(`Successfully sent notification to ${memberId}:`, response);

        sendResults.push({ memberId, status: "success" });
      } catch (innerError) {
        console.error(`Error sending to ${memberId}:`, innerError);
        sendResults.push({
          memberId,
          status: "failed",
          error:
            innerError instanceof Error ? innerError.message : "Unknown error",
        });
      }
    }

    res.status(200).json({ success: true, results: sendResults });
  } catch (error) {
    console.error("Error sending group notifications:", error);
    res.status(500).json({
      error: "Failed to send group notifications",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
