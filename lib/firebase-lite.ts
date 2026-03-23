import { getFirestore } from "firebase/firestore/lite";
import { app, auth, initAnalytics } from "@/lib/firebase-core";

export { app, auth, initAnalytics };
export const dbLite = getFirestore(app);
