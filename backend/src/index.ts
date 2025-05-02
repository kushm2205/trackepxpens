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
        "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCwv6VsQ7qNkWko\nnkmPMxo4knbMdPyD0To4X73kznAjIPkPTwmcGlcFn2N/jxvnJ6s/FX3mFjGJ3c7k\nfeHqIyeB+kXzT/F2ABfD3xnj1p1/Av64hNTX2n2BSK2hp/Ak54ndzKl5yEOXed+A\nwJZb/Q7hDZiCD+rILUjRY0o+oMRIeWWol8sSTW2kBni+CptKf9JL8L50HWabIIKM\niwSX2ok0Vx1BkqVfMBdyl120y1Mg/GZooBs1/lbzyau1AKAX0nveZdjHKL8dKJEz\n33ya7vLArHH7dPt1n8BOxHmVGRnoiyTSfOm8qG572aTd95ZRL0PMjFzHAGUWtwSa\n1sRoymK7AgMBAAECggEAVF0thucvGNqS4J3pC45/Ughq5v1h+EM6cGUWnSuCL+pR\npyJ5OkcCSX9CPUUgMu3m2cYW4WevfpheZAbH+fuMpIhCsjfyz3mM3mPTlkI+y7yw\nu38/nsY9yKNZqUMhJ2RTFIjXTfcueBNmgKysOD0qSHa2WEJjtOeUjclAS3NuLQ7l\nozwx/OeuXfzrplAtsFN5sSCnBNZ9UlvMZeR1YkVWurBfT2crzDCOddlFL2kSY04l\nDquh96m6Yi+Zs8nGvzFO/SZs52IMKFSKis2xGVn9SRVeBwwS1yKrpOz5hNzWAexw\nFeAN0b1NTO/m/aVTZn4BZ+x7LmwqP8IqXOhx6GzNdQKBgQDdS+Pbglz9UZdhk6VZ\nn6KkFzTaC3A3xWeOZsDpuoaeKS3O+j+XXfHsr5etzClM5bZBaDTuCWqVJTyEqbdW\nLHheckS05SJRb/aLxI2Kn1UcorkWJCaCRByOvhamLmMb7DPjiDIBS4r/BPlr5yug\n8tQoFgEz9K5ZDSb2Wuq0UpgZhQKBgQDMd1m8nAJE2C261rW8SeOoZIQcTt50vNOW\n90MN7q8ILGYZSVzCTV19Nro3CpsLlbAUiZW/SM4wS96JZ87PeWzxusvkyJ56ZBi0\nsfqa3trSi1AbvyGDRzYrgiXVL8U+XXpy/d0JEnkWyIT3UmDj3GYRL2wv6/g5kG5/\nSHajycEfPwKBgFxbyAVdKyIuY1e+H0yAa4jAhrZZ/8PHB6lPCUSDLJvl49B2cQPj\nmYyG3G8Uvkfxt1ck/rI6C9mjaNaVXocAmFwSpMo6t0/1wpgiuFAan5ML9uNewxOr\nCaAphZpl0cddlWpo9TXFKYW1tcNq/7J0pkb0qBvfCsTv0EsRNtN7hS9hAoGAdbMm\npxovfC3tdSZwC2mFccQbAKiuCglAzCCeKwEBJPVZ+KhwizE55gCBBXpHck3CxK/G\n0gw5FTg3bGWjeW9utWBQSuzpvY6tYicqGci7soObo71Mr2No3XbYDHapVpM9D8Dv\nYm+N4P2g/TYgrEqNPstLvfJaO9jWotK16OcVEsUCgYBnbfVjpV/78yCD3nPgWBIh\nVA0kPJBegmBix0mW6HcgNn7AE3fJZwW4SWIIiQZ1NPoAADlJgcIb7G51+Vq/QXQA\ncEr8nmJ2NLCbLe12/NFaGO8x9oqjpvX8AdQptNcO/9h2plHzAUY/W3gpsNBMGxFi\nnG1kr84JK+WvzpIduQaRqg==\n-----END PRIVATE KEY-----\n".replace(
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
