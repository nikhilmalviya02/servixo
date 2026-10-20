const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account.json");

// Guard against re-initialization in Vercel serverless environment
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;