# Authentication Setup Guide

Complete guide to set up Google Sign-In and Phone OTP authentication for MediFind.

## ✅ What's Already Working

- **Email/Password Signup** - Users can create accounts with email
- **Email/Password Login** - Users can login with credentials
- **Doctors List** - Browse and book consultations

---

## 🔐 Google Sign-In Setup

### Step 1: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your **MediFind** project
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** and toggle **Enable**
5. Click **Save**

### Step 2: Get Web Client ID

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Find the **Web app** (if not created, add one)
4. Copy the **Web client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)

### Step 3: Update `.env` File

Replace the placeholder in `.env`:
```
GOOGLE_WEB_CLIENT_ID=YOUR_ACTUAL_WEB_CLIENT_ID_HERE
```

### Step 4: Add SHA-256 Certificate to Firebase

For Google Sign-In to work on Android, you need to add your app's SHA-256:

```bash
cd android
./gradlew signingReport
```

Copy the **SHA-256** from the output (look for `Variant: debug`).

Then:
1. Go to Firebase Console → Project Settings
2. Scroll to **Your apps** → Select your Android app
3. Click **Add fingerprint**
4. Paste the SHA-256
5. Click **Save**

### Step 5: Test Google Sign-In

1. Reload the app
2. Go to Login screen
3. Tap **"Continue with Google"**
4. Select your Google account
5. You should be signed in!

---

## 📱 Phone OTP Authentication Setup

### Step 1: Enable Phone Authentication in Firebase

1. Go to Firebase Console → **Authentication** → **Sign-in method**
2. Click on **Phone** and toggle **Enable**
3. Click **Save**

### Step 2: Add SHA-256 Certificate (Same as Google Sign-In)

If you haven't already:
```bash
cd android
./gradlew signingReport
```

Add the SHA-256 to Firebase Console → Project Settings → Your apps.

### Step 3: Configure reCAPTCHA (For Testing)

Phone authentication requires reCAPTCHA verification. For testing:

1. Firebase Console → **Authentication** → **Sign-in method** → **Phone**
2. Scroll down to **Test phone numbers**
3. Click **Add phone number**
4. Add test numbers with codes:
   - Phone: `+1 650-555-3434`
   - Code: `123456`

### Step 4: Update AndroidManifest.xml (Already Done)

The following permissions are already added:
- `INTERNET`
- `ACCESS_NETWORK_STATE`

### Step 5: Test Phone OTP

1. Reload the app
2. Go to Login screen
3. Toggle to **Phone** tab
4. Enter: `+16505553434` (test number)
5. Tap **Send Code**
6. Enter code: `123456`
7. You should be signed in!

---

## 🔥 Firebase Security Rules

Make sure these rules are set in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Doctors collection - public read
    match /doctors/{doctorId} {
      allow read: if true;
      allow write: if false;
    }

    // Availability collection - public read
    match /availability/{availabilityId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Users collection - authenticated users only
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Consultations - users can read/write their own
    match /consultations/{consultationId} {
      allow read: if request.auth != null &&
        (resource.data.patientId == request.auth.uid ||
         resource.data.doctorId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (resource.data.patientId == request.auth.uid ||
         resource.data.doctorId == request.auth.uid);
    }
  }
}
```

---

## 📊 Authentication Summary

| Method | Status | Notes |
|--------|--------|-------|
| Email/Password | ✅ Working | No additional setup needed |
| Google Sign-In | 🔧 Needs Setup | Requires Web Client ID + SHA-256 |
| Phone OTP | 🔧 Needs Setup | Requires SHA-256 + Test numbers |

---

## 🧪 Testing Authentication

### Test Email Signup/Login
1. Open app → Login screen
2. Tap "Sign Up"
3. Enter email, password, name, phone
4. Tap "Sign Up"
5. Login with same credentials

### Test Google Sign-In
1. Complete Google setup above
2. Open app → Login screen
3. Tap "Continue with Google"
4. Select Google account
5. Should be logged in

### Test Phone OTP
1. Complete Phone setup above
2. Open app → Login screen
3. Toggle to "Phone" tab
4. Enter: `+16505553434`
5. Tap "Send Code"
6. Enter: `123456`
7. Should be logged in

---

## 🐛 Troubleshooting

### Google Sign-In Issues

**Error: "Sign-in failed"**
- Check Web Client ID is correct in `.env`
- Verify SHA-256 is added to Firebase Console
- Make sure Google is enabled in Authentication

**Error: "DEVELOPER_ERROR"**
- SHA-256 mismatch - regenerate and update
- Check package name matches Firebase

### Phone OTP Issues

**Error: "Too many requests"**
- Use test phone numbers from Firebase Console
- Wait 15-30 minutes before retrying

**Error: "Invalid phone number"**
- Must include country code (e.g., `+91` for India)
- Format: `+[country code][number]`

**OTP not received**
- For testing, use test numbers from Firebase Console
- For production, configure Cloud Functions for SMS

---

## 📝 Next Steps

After setting up authentication:

1. ✅ Test all 3 auth methods (Email, Google, Phone)
2. ✅ Book a consultation with a doctor
3. 🔜 Implement video calling with Agora
4. 🔜 Deploy Cloud Functions for notifications

---

## 🆘 Support Links

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In for Android](https://firebase.google.com/docs/auth/android/google-signin)
- [Phone Authentication](https://firebase.google.com/docs/auth/android/phone-auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
