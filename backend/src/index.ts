import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import otpRoutes from "./Router/otproutes";
import bodyParser from "body-parser";
import * as admin from "firebase-admin";
import notificationRoutes from "./Router/notificationRoutes";
const app = express();

const serviceAccount = require("./service.json");
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "expenss-fc1b4",
      clientEmail:
        "firebase-adminsdk-fbsvc@expenss-fc1b4.iam.gserviceaccount.com",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCwnGNQeuT/am1f\nAwnnHAJVAZTSfBXJ5MPErJZybHKpc2lVwZyFm26Zf3hFblo0qwf5wj++PaKT250W\nhLecEDzMOlSGIeLSfzm6hZR3c+JA5S3RzUyGhNaVaXPPkZS2Ulzh/6hhjZFOT62K\nrC8H6sO+XVdMp1YgPMSSTGAQpYFI5e0RtwohHpQOzdZkzrI/hJsnPmjT1tF5w1sK\n4eFfK3A+nM30Ai9oYkUEFsnyArZJgeEM8qg7IZomGND9YPEMH+zdjZcJcCRQI7we\nMD0FJkuTx4mWHs8nA1JHluSXsnixqX78h0ZinNy0nnE2RI0qgmxqpNVm41TUR+CY\nRTqpzJ8VAgMBAAECggEAFmQBWFj4UuR2kMrlFMKRjh7o9AWMyp+g7TyXR1L194M9\nCcUF18+EplvJjv3mXFKJrJHCvJb6V2YKpKn3UEcjuh20DRxbMiY0lq/sSner6d/U\nXwq45r4NKXyo1NpHYRUQlwtvWMzWrPe/j/rz7HxITEhvsrVtXyFtJ4Ic1Mdy3F+q\nJkYntzlmlo6RuipzqYhWXvjJGnjm/Te5NRqijcSqL/fMN6wAs7MsA8TJV9yfIYOu\n/+XS1fHYtLQnFHrK9RBqMzMWlLVmBWQTY7Pp3iAskyh2RMfzdUxPdtTdha9d+z+s\nHQfRlZ/GwtDcttw6qKGvuqY7rjiChWnhRy2Fc1UrIQKBgQDeViDOv0YellTKtgvW\nHAW1DCMviK7Wt+5hSEoY6Aaso0CIxiQZ0ACezSFcQ2s3UCfLKbs5f2PJP9M5Own4\njapHmpkvdTUTGxw+ehuTMHIIdgPl9ho9nZfsGkgOmaF8eQsgl+WjX4VFTXElrom9\nJitr/NGAMwz2nFALyzC//XoTtQKBgQDLWeolT1cLIsR6M6iPd1ryDQ0/rcwMeD+8\n2DgkJW0n2JUGoFS1zj4mBSTEFDEYoaeHOwptEarc2Em+WIAizzgF+TE3d2RyZh2g\noi8omeCN6jVxArykC+U3ofyBicoZgtRibE4ukl/yVqqMT5oLarymrpNl044f3BfS\njNR/FWY54QKBgQCEmb1rUKxTJblgRH5+ravBtIFvogcUTBJBtslqXUdNwveEGxgA\nxQr5qsGQsyzIimeRRUxCGHW82vHwmgNyV5sMpWli4nZK9Mo9gLndaPE5lpjwl3xC\n7zBiQbJj8sBa6h32zGDKtPdYw70NijDfvFn9R4Ty/n9mvQcIYaCrgFNEWQKBgQC0\nxmEt++Ngpe7OyB/AMpXp+opdos50A25+HiWClLb+Jj8NXfkQiqGbQRVXLrAaupLo\n2CbDoWIo5CpiieCXkWm3fbkwGvZz8K3EAIo16N3Eq4IIzisPFvgVxe5o5iqBFVpj\niO7T3hJnqH4DMDy8i43cC/RDIJgHYKzY45OAynBPYQKBgHyn9ZrlyG9xd26/iT3a\ngqcKxB9VJXO+uC5HMptg5QD/xSHiTgUxBSvAQg972sN8t5vISCh9yRGwQ759MSta\n3Zpi9nuli6FbP7YaW3TCAzd+55m7VOqSPFi1h1mK1KfPsJ9EnimKD/+I6UOvFb/y\n2IzTU/H4bxOfCOeE9qNJvQCC\n-----END PRIVATE KEY-----\n".replace(
          /\\n/g,
          "\n"
        ),
    }),
    databaseURL: "https://expenss-fc1b4.firebaseio.com",
  });
  console.log("datbase connection sucees");
} catch (err) {
  console.log("error");
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
