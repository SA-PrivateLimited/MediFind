# Google Sign-In DEVELOPER_ERROR Fix

## Current Status
✅ App is running successfully
✅ Google Sign-In native module is loaded
❌ Getting DEVELOPER_ERROR when clicking "Continue with Google"

## Error Meaning
`DEVELOPER_ERROR` means the SHA-256 fingerprint in Firebase doesn't match your app's keystore.

## Quick Fix Steps

### Step 1: Verify SHA-256 Fingerprints are Added to Firebase

Run this command to get your SHA-256:
```bash
cd android
./gradlew signingReport
```

Look for output like:
```
Variant: debug
Config: debug
Store: /Users/sandeepgupta/.android/debug.keystore
Alias: androiddebugkey
SHA-256: 17:E9:ED:2B:78:FC:B3:9B:5F:50:E6:F5:46:C8:99:B5:24:0E:D6:53:37:56:DE:18:D7:EE:80:A4:96:CF:18:50
```

### Step 2: Add SHA-256 to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **MediFind** project
3. Go to **Project Settings** (gear icon)
4. Scroll to **Your apps** → Select **Android app (com.medifind)**
5. Click **Add fingerprint**
6. Paste the **SHA-256** from Step 1
7. Click **Save**

### Step 3: Verify Web Client ID

1. In Firebase Console → **Project Settings** → **General**
2. Scroll to **Your apps** → Find **Web app**
3. Copy the **Web client ID** (looks like: `xxxxx-xxxxxxx.apps.googleusercontent.com`)
4. Update `.env` file:
```
GOOGLE_WEB_CLIENT_ID=136199853280-v1ea3pa1fr44qv5hihp6ougjcrib3dj5.apps.googleusercontent.com
```

### Step 4: Rebuild the App

After adding SHA-256 and verifying Web Client ID:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Step 5: Download google-services.json Again

1. Go to Firebase Console → Project Settings
2. Scroll to **Your apps** → Android app
3. Click **Download google-services.json**
4. Replace `android/app/google-services.json` with the new file

## Testing

After completing all steps:
1. Open the app
2. Go to Consultations tab
3. Tap "Continue with Google"
4. Select your Google account
5. You should be signed in successfully!

## Common Issues

### Issue: "Sign-in cancelled"
- This is normal if you close the Google Sign-In popup
- Try again and select an account

### Issue: "SIGN_IN_FAILED"
- Make sure Google Sign-In is **enabled** in Firebase Console → Authentication → Sign-in method
- Check that your Google account has internet connection

### Issue: Still getting DEVELOPER_ERROR
- Double-check SHA-256 matches exactly (including colons)
- Make sure you're using the **Web client ID** (NOT Android client ID)
- Wait 5-10 minutes after adding SHA-256 for Firebase to update

## Success Indicators

When Google Sign-In is working correctly, you should see:
```
LOG  Starting Google Sign-In...
LOG  Google Sign-In successful: <user_id>
```

And no DEVELOPER_ERROR in the logs.
