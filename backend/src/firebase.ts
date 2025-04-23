// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("./service.json"); // download this from Firebase console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
