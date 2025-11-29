import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import type {User} from '../types/consultation';

/**
 * Authentication Service
 * Handles Firebase Authentication (Google, Phone & Email/Password)
 */

const COLLECTIONS = {
  USERS: 'users',
};

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
});

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  phone: string,
): Promise<User> => {
  try {
    console.log('Signing up with email...');

    // Create Firebase Auth user
    const userCredential = await auth().createUserWithEmailAndPassword(
      email,
      password,
    );

    // Update display name
    await userCredential.user.updateProfile({
      displayName: name,
    });

    // Get FCM token
    const fcmToken = await messaging().getToken();

    // Create user document in Firestore
    const userData: User = {
      id: userCredential.user.uid,
      name,
      email,
      phone,
      createdAt: new Date(),
      fcmToken,
    };

    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(userCredential.user.uid)
      .set(userData);

    console.log('User created successfully:', userCredential.user.uid);
    return userData;
  } catch (error: any) {
    console.error('Error signing up:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email is already registered. Please login instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    }
    throw new Error('Failed to create account. Please try again.');
  }
};

/**
 * Login with email and password
 */
export const loginWithEmail = async (
  email: string,
  password: string,
): Promise<User> => {
  try {
    console.log('Logging in with email...');

    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password,
    );

    // Get user data from Firestore
    const userDoc = await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(userCredential.user.uid)
      .get();

    if (!userDoc.exists) {
      throw new Error('User data not found');
    }

    // Update FCM token
    const fcmToken = await messaging().getToken();
    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(userCredential.user.uid)
      .update({fcmToken});

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
      createdAt: userDoc.data()?.createdAt?.toDate(),
      fcmToken,
    } as User;

    console.log('Login successful:', userData.id);
    return userData;
  } catch (error: any) {
    console.error('Error logging in:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    throw new Error('Failed to login. Please try again.');
  }
};

/**
 * Send phone verification code
 */
export const sendPhoneVerificationCode = async (
  phoneNumber: string,
): Promise<any> => {
  try {
    console.log('Sending verification code to:', phoneNumber);

    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

    console.log('Verification code sent');
    return confirmation;
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    }
    throw new Error('Failed to send verification code. Please try again.');
  }
};

/**
 * Verify phone number with code
 */
export const verifyPhoneCode = async (
  confirmation: any,
  code: string,
  name: string,
  email?: string,
): Promise<User> => {
  try {
    console.log('Verifying phone code...');

    const userCredential = await confirmation.confirm(code);

    // Check if user document exists
    const userDoc = await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(userCredential.user.uid)
      .get();

    let userData: User;

    if (userDoc.exists) {
      // Existing user - update FCM token
      const fcmToken = await messaging().getToken();
      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userCredential.user.uid)
        .update({fcmToken});

      userData = {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data()?.createdAt?.toDate(),
        fcmToken,
      } as User;
    } else {
      // New user - create document
      const fcmToken = await messaging().getToken();

      userData = {
        id: userCredential.user.uid,
        name,
        email: email || '',
        phone: userCredential.user.phoneNumber || '',
        createdAt: new Date(),
        fcmToken,
      };

      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userCredential.user.uid)
        .set(userData);
    }

    console.log('Phone verification successful:', userData.id);
    return userData;
  } catch (error: any) {
    console.error('Error verifying code:', error);
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('Verification code expired. Please request a new one.');
    }
    throw new Error('Failed to verify code. Please try again.');
  }
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  try {
    console.log('Logging out...');
    await auth().signOut();
    console.log('Logout successful');
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Failed to logout. Please try again.');
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      return null;
    }

    const userDoc = await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(currentUser.uid)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
      createdAt: userDoc.data()?.createdAt?.toDate(),
    } as User;

    return userData;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>,
): Promise<User> => {
  try {
    console.log('Updating user profile...');

    await firestore().collection(COLLECTIONS.USERS).doc(userId).update({
      ...updates,
      updatedAt: new Date(),
    });

    const userDoc = await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get();

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
      createdAt: userDoc.data()?.createdAt?.toDate(),
    } as User;

    console.log('Profile updated successfully');
    return userData;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
};

/**
 * Reset password via email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    console.log('Sending password reset email...');
    await auth().sendPasswordResetEmail(email);
    console.log('Password reset email sent');
  } catch (error: any) {
    console.error('Error sending reset email:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    throw new Error('Failed to send reset email. Please try again.');
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    console.log('Starting Google Sign-In...');

    // Check if device supports Google Play services
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

    // Get user's ID token
    const {idToken} = await GoogleSignin.signIn();

    // Create Google credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign in with credential
    const userCredential = await auth().signInWithCredential(googleCredential);

    // Check if user document exists
    const userDoc = await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(userCredential.user.uid)
      .get();

    let userData: User;

    if (userDoc.exists) {
      // Existing user - update FCM token
      const fcmToken = await messaging().getToken();
      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userCredential.user.uid)
        .update({fcmToken});

      userData = {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data()?.createdAt?.toDate(),
        fcmToken,
      } as User;
    } else {
      // New user - create document
      const fcmToken = await messaging().getToken();

      userData = {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || 'User',
        email: userCredential.user.email || '',
        phone: userCredential.user.phoneNumber || '',
        createdAt: new Date(),
        fcmToken,
      };

      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userCredential.user.uid)
        .set(userData);
    }

    console.log('Google Sign-In successful:', userData.id);
    return userData;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign-in cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign-in already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    }
    throw new Error('Failed to sign in with Google. Please try again.');
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth().currentUser !== null;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (
  callback: (user: User | null) => void,
): (() => void) => {
  return auth().onAuthStateChanged(async firebaseUser => {
    if (firebaseUser) {
      const userData = await getCurrentUser();
      callback(userData);
    } else {
      callback(null);
    }
  });
};

export default {
  signUpWithEmail,
  loginWithEmail,
  signInWithGoogle,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  logout,
  getCurrentUser,
  updateUserProfile,
  resetPassword,
  isAuthenticated,
  onAuthStateChanged,
};
