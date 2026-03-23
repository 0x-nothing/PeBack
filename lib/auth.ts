import {
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase-core";
import { createUser, getUserProfile } from "@/lib/firebase-user-collections";
import { AppUser } from "@/lib/types";

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@peback.local`;
}

function profileFromCredential(credential: UserCredential, username: string): AppUser {
  return {
    id: credential.user.uid,
    username: username.trim(),
    role: "user",
    balance: 0,
    linkedBank: null,
    createdAt: new Date().toISOString()
  };
}

export async function registerWithUsername(username: string, password: string) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);
    const profile = profileFromCredential(credential, username);
    try {
      await createUser(profile);
    } catch (error) {
      await credential.user.delete();
      throw error;
    }
    return profile;
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw error;
    }
    throw error;
  }
}

export async function loginWithUsername(username: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
  const user = await getUserProfile(credential.user.uid);
  if (!user) {
    throw new Error("Khong tim thay ho so user trong Firestore.");
  }
  return user;
}

export async function logoutCurrentUser() {
  try {
    await signOut(auth);
  } catch {
    return;
  }
}
