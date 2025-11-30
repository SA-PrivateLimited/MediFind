import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';
import authService from '../services/authService';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const {isDarkMode, setCurrentUser, redirectAfterLogin, setRedirectAfterLogin} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.loginWithEmail(email, password);
      await setCurrentUser(user);
      Alert.alert('Success', 'Logged in successfully!');

      // Redirect to previous page if available
      if (redirectAfterLogin) {
        const {route, params} = redirectAfterLogin;
        setRedirectAfterLogin(null);
        navigation.navigate(route, params);
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    // Format phone number with country code
    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+${phoneNumber}`;

    setLoading(true);
    try {
      const confirmation = await authService.sendPhoneVerificationCode(
        formattedPhone,
      );
      setConfirmResult(confirmation);
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter verification code');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.verifyPhoneCode(
        confirmResult,
        verificationCode,
        'User', // Default name, can update in profile
      );
      await setCurrentUser(user);
      Alert.alert('Success', 'Logged in successfully!');

      // Redirect to previous page if available
      if (redirectAfterLogin) {
        const {route, params} = redirectAfterLogin;
        setRedirectAfterLogin(null);
        navigation.navigate(route, params);
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await authService.signInWithGoogle();
      await setCurrentUser(user);
      Alert.alert('Success', 'Signed in with Google successfully!');

      // Redirect to previous page if available
      if (redirectAfterLogin) {
        const {route, params} = redirectAfterLogin;
        setRedirectAfterLogin(null);
        navigation.navigate(route, params);
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      if (error.message !== 'Sign-in cancelled') {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset email to ${email}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Send',
          onPress: async () => {
            try {
              await authService.resetPassword(email);
              Alert.alert('Success', 'Password reset email sent!');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Icon name="medical" size={60} color={theme.primary} />
          <Text style={[styles.title, {color: theme.text}]}>MediFind</Text>
          <Text style={[styles.subtitle, {color: theme.textSecondary}]}>
            Login to access doctor consultations
          </Text>
        </View>

        {/* Login Method Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !isPhoneLogin && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setIsPhoneLogin(false)}>
            <Text
              style={[
                styles.toggleText,
                {color: !isPhoneLogin ? '#fff' : theme.textSecondary},
              ]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isPhoneLogin && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setIsPhoneLogin(true)}>
            <Text
              style={[
                styles.toggleText,
                {color: isPhoneLogin ? '#fff' : theme.textSecondary},
              ]}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email Login Form */}
        {!isPhoneLogin && (
          <View style={styles.form}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}>
              <Icon
                name="mail-outline"
                size={20}
                color={theme.textSecondary}
              />
              <TextInput
                style={[styles.input, {color: theme.text}]}
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}>
              <Icon
                name="lock-closed-outline"
                size={20}
                color={theme.textSecondary}
              />
              <TextInput
                style={[styles.input, {color: theme.text}]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}>
              <Text style={[styles.forgotPasswordText, {color: theme.primary}]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: theme.primary},
                loading && styles.buttonDisabled,
              ]}
              onPress={handleEmailLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Phone Login Form */}
        {isPhoneLogin && (
          <View style={styles.form}>
            {!confirmResult ? (
              <>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Icon
                    name="call-outline"
                    size={20}
                    color={theme.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, {color: theme.text}]}
                    placeholder="Phone Number (with country code)"
                    placeholderTextColor={theme.textSecondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: theme.primary},
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleSendPhoneCode}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Icon
                    name="keypad-outline"
                    size={20}
                    color={theme.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, {color: theme.text}]}
                    placeholder="Verification Code"
                    placeholderTextColor={theme.textSecondary}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: theme.primary},
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleVerifyPhoneCode}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendPhoneCode}
                  disabled={loading}>
                  <Text style={[styles.resendText, {color: theme.primary}]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Google Sign-In */}
        {!isPhoneLogin && (
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, {backgroundColor: theme.border}]} />
            <Text style={[styles.dividerText, {color: theme.textSecondary}]}>
              OR
            </Text>
            <View style={[styles.divider, {backgroundColor: theme.border}]} />
          </View>
        )}

        {!isPhoneLogin && (
          <TouchableOpacity
            style={[
              styles.googleButton,
              {backgroundColor: theme.card, borderColor: theme.border},
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading}>
            <Icon name="logo-google" size={20} color="#DB4437" />
            <Text style={[styles.googleButtonText, {color: theme.text}]}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        )}

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: theme.textSecondary}]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.linkText, {color: theme.primary}]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    borderRadius: 10,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  resendText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
