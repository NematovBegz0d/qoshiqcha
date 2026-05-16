import admin from "firebase-admin";
import { env } from "./config/env.js";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(env.FIREBASE_SERVICE_ACCOUNT),
  });
}

export const db = admin.firestore();
export { admin };
