import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import otpRoutes from "./Router/otproutes";
import bodyParser from "body-parser";
import * as admin from "firebase-admin";
import notificationRoutes from "./Router/notificationRoutes";
const app = express();

// interface NotificationRequest {
//   payerId: string;
//   friendId: string;
//   expenseId: string;
//   description: string;
//   amount: number;
// }
// Initialize Firebase Admin SDK
const serviceAccount = require("./service.json");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "expenss-fc1b4",
    clientEmail:
      "firebase-adminsdk-fbsvc@expenss-fc1b4.iam.gserviceaccount.com",
    privateKey:
      "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCbDN4H1BXuiWC6\nPLdW/gXFMUUX7YzvS7yKbiLjp6gbFSqUVvF1SY31x7u8NyLINUBb4ibZ2FovC1H1\nOKCdS5bIxsBrwTQSYc7wmm79tsHguvxPFzLiA16Nn7RRMZvR7p2A9W/Wqqr5kZRT\n62KKpa3dQ6ROM3RQ6f0Q4QICQgX7pJCbTSb7r3y1kkib8aTey2w7zJ7JKfw1RNHb\n8BlhiUJlOE4eAIUwQYN576xLT1OPEP+yAHYeU04LovDbbZk5dWUFlu4rPCcQ4/WL\nJdm+9foY64IpEpMUQg5AcEJqhiqile6Uumutu967fwNgVC9bttzlbHZIpuejlb5G\n9aTbrulFAgMBAAECggEAFKLVSEBzfNB+9bqQAj2D4hdpJUKiH9U6LkhzT05ootYh\n2SVrNJuKD9y6AVZrRC9GNhR27EaN1jYQ/ey//79oPaeqQ40u04V+B+rd+9mfmzv3\nycUCKi+dnYbUdnv+S6YRA3FnJbCIWfgEwFiTQHXFmq3eh+P0RrKl0mHIJSnJZxDu\nYpOBT52/n7DN5AiGz3SJNsKuhTHYos6qQuCgm4H+xzqm01nZ0+QgWn3QZ/8JHhV6\nybuYgTSKgoHPMGVacyl1+VHSVw75jqslX5A7a4lrVndNUQoa2Rz7YrgTqbmlPUMi\nk9znFleteHZl594+XGHf83w2itZ8NJWQAhTEuvmRPwKBgQDUtLkELDZm/E8eOMYn\nV6EqnF7bv8TMwSMWZ+8XyBzZxElg6hzy3urKmxd9D12FNgiQ3vsSifaqWhn3/wxF\nV55gW4E7WhwmTuxaj0G43NhAr/TLdomqk03T332btF9wDj0hUw4YOy6xM3LHhtlo\noexYD1XMDUvKcJbu5lxrv9Hd6wKBgQC6m+6FTaxwccT1+WHon9o3Me3knbOcpL18\nxrp66Tivy1hglvegabq82AfOkBdIKK1OjGUp6fF+QccknWFn0xvw9nU2HWjUfp58\nGi01eog8omz7vxlAdRoS+KQo5YMbZ+Lhcu/JeARxzwS5ZfxCT/NGgJbGM0i18i8d\nzzGNSlgZjwKBgANRJil4fwiwGpPAEub+KNc/RQNsRCdlQ6TPzhyy1DBZLUPDotvu\nuf6a2IzstmqjYxLPR18Mo7oYWZtScOCL8z5Rbvx79UBrrqfi4AV//CdWFx0tJgxw\n65/INm89KtfWgQGKCAg8tAezY7DU24MUM1lUM+RQuMPZaaEkGoDbpuwtAoGAa8vb\n00F1VVdDMdwnhNuikLPU+nVm5hv8IfIikxHaXyKWIOXUkePBrYkVqWtvJ43n3zIW\n1kl/6TFSOoJ3XCSFRYL5XpNKlUW3g3UTnIr13CDv19UiXyvGLiNXoRBD1jcCxr1A\nax9bYer2jaquOBg7LgTmFARYAlKuiQfBVh8WGV0CgYAQy51udurRubIa/m6zgC8E\ngo0gBqGaEDgiy6zmCGFhU5BPmjyBkQ1XftUjQ59o6ikxPoV+QIO4UJcN4qGh96/B\n10d4w2qG/WiKR7ebKHfK5YYuibSJ5UDe2UJEZfujLP2UrLrYpDaGzfAeyMGROn9m\ngcJ0DHySlHawwVUPDE42ag==\n-----END PRIVATE KEY-----\n".replace(
        /\\n/g,
        "\n"
      ),
  }),
  databaseURL: "https://expenss-fc1b4.firebaseio.com",
});
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

connectDB();

// app.post("/send-expense-notification", async (req: Request, res: Response) => {
//   try {
//     const {
//       payerId,
//       friendId,
//       expenseId,
//       description,
//       amount,
//     }: NotificationRequest = req.body;

//     console.log("Expense notification request:", {
//       payerId,
//       friendId,
//       expenseId,
//       description,
//       amount,
//     });

//     if (!payerId || !friendId || !description) {
//       res.status(400).json({ error: "Missing required fields" });
//       return;
//     }

//     const friendDoc = await admin
//       .firestore()
//       .collection("users")
//       .doc(friendId)
//       .get();

//     if (!friendDoc.exists) {
//       console.log(`Friend not found: ${friendId}`);
//       res.status(404).json({ error: "Friend not found" });
//       return;
//     }

//     const friendData = friendDoc.data();

//     if (!friendData?.fcmToken) {
//       console.log(`Friend has no FCM token: ${friendId}`);
//       res.status(400).json({ error: "Friend has no FCM token" });
//       return;
//     }

//     const payerDoc = await admin
//       .firestore()
//       .collection("users")
//       .doc(payerId)
//       .get();
//     const payerData = payerDoc.exists ? payerDoc.data() : null;
//     const payerName = payerData?.name || "Someone";

//     console.log(`Sending notification to token: ${friendData.fcmToken}`);

//     const payload: admin.messaging.Message = {
//       token: friendData.fcmToken,
//       notification: {
//         title: "New Expense Added",
//         body: `${payerName} added an expense: ${description} - ₹${amount}`,
//       },
//       data: {
//         type: "NEW_EXPENSE",
//         expenseId,
//         payerId,
//         friendId,
//         description,
//         amount: amount.toString(),
//         timestamp: new Date().toISOString(),
//         click_action: "FLUTTER_NOTIFICATION_CLICK",
//       },
//       android: {
//         priority: "high",
//         notification: {
//           clickAction: "FLUTTER_NOTIFICATION_CLICK",
//           channelId: "expenses",
//         },
//       },
//       apns: {
//         payload: {
//           aps: {
//             contentAvailable: true,
//           },
//         },
//       },
//     };

//     const response = await admin.messaging().send(payload);
//     console.log("Successfully sent notification:", response);

//     res.status(200).json({ success: true, messageId: response });
//   } catch (error) {
//     console.error("Error sending notification:", error);
//     res.status(500).json({
//       error: "Failed to send notification",
//       message: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// });
// app.post(
//   "/send-group-expense-notification",
//   async (req: Request, res: Response) => {
//     try {
//       const {
//         payerId,
//         groupId,
//         expenseId,
//         description,
//         amount,
//       }: {
//         payerId: string;
//         groupId: string;
//         expenseId: string;
//         description: string;
//         amount: number;
//       } = req.body;

//       console.log("Group expense notification request:", {
//         payerId,
//         groupId,
//         expenseId,
//         description,
//         amount,
//       });

//       if (!payerId || !groupId || !description) {
//         res.status(400).json({ error: "Missing required fields" });
//         return;
//       }

//       // Fetch group document
//       const groupDoc = await admin
//         .firestore()
//         .collection("groups")
//         .doc(groupId)
//         .get();
//       if (!groupDoc.exists) {
//         console.log(`Group not found: ${groupId}`);
//         res.status(404).json({ error: "Group not found" });
//         return;
//       }

//       const groupData = groupDoc.data();
//       const members: string[] = groupData?.members || [];

//       if (!members.length) {
//         console.log(`No members in group: ${groupId}`);
//         res.status(400).json({ error: "No members in group" });
//         return;
//       }

//       // Get payer's name
//       const payerDoc = await admin
//         .firestore()
//         .collection("users")
//         .doc(payerId)
//         .get();
//       const payerData = payerDoc.exists ? payerDoc.data() : null;
//       const payerName = payerData?.name || "Someone";

//       const sendResults: {
//         memberId: string;
//         status: string;
//         error?: string;
//       }[] = [];

//       for (const memberId of members) {
//         if (memberId === payerId) continue;

//         try {
//           const memberDoc = await admin
//             .firestore()
//             .collection("users")
//             .doc(memberId)
//             .get();
//           if (!memberDoc.exists) {
//             console.log(`Member not found: ${memberId}`);
//             sendResults.push({
//               memberId,
//               status: "failed",
//               error: "Member not found",
//             });
//             continue;
//           }

//           const memberData = memberDoc.data();
//           if (!memberData?.fcmToken) {
//             console.log(`Member has no FCM token: ${memberId}`);
//             sendResults.push({
//               memberId,
//               status: "failed",
//               error: "No FCM token",
//             });
//             continue;
//           }

//           console.log(`Sending notification to token: ${memberData.fcmToken}`);

//           const payload: admin.messaging.Message = {
//             token: memberData.fcmToken,
//             notification: {
//               title: `New Expenses added`,
//               body: `${payerName} added an expense: ${description} - ₹${amount}`,
//             },
//             data: {
//               type: "NEW_GROUP_EXPENSE",
//               expenseId,
//               payerId,
//               groupId,
//               description,
//               amount: amount.toString(),
//               timestamp: new Date().toISOString(),
//               click_action: "FLUTTER_NOTIFICATION_CLICK",
//             },
//             android: {
//               priority: "high",
//               notification: {
//                 clickAction: "FLUTTER_NOTIFICATION_CLICK",
//                 channelId: "expenses",
//               },
//             },
//             apns: {
//               payload: {
//                 aps: {
//                   contentAvailable: true,
//                 },
//               },
//             },
//           };

//           const response = await admin.messaging().send(payload);
//           console.log(
//             `Successfully sent notification to ${memberId}:`,
//             response
//           );

//           sendResults.push({ memberId, status: "success" });
//         } catch (innerError) {
//           console.error(`Error sending to ${memberId}:`, innerError);
//           sendResults.push({
//             memberId,
//             status: "failed",
//             error:
//               innerError instanceof Error
//                 ? innerError.message
//                 : "Unknown error",
//           });
//         }
//       }

//       res.status(200).json({ success: true, results: sendResults });
//     } catch (error) {
//       console.error("Error sending group notifications:", error);
//       res.status(500).json({
//         error: "Failed to send group notifications",
//         message: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   }
// );

app.use("/api", otpRoutes);
app.use("/", notificationRoutes);
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
