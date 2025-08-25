/**
 * Firebase Redirect Result Handler
 * Handles the result of signInWithRedirect to prevent unhandled promise rejections
 */

import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./firebase";

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // This gives you a Google Access Token. You can use it to access Google APIs.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // The signed-in user info.
      const user = result.user;
      console.log('User signed in via redirect:', user?.email);
      
      return { user, token };
    }
    return null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    // Don't rethrow to prevent unhandled rejections
    return null;
  }
};