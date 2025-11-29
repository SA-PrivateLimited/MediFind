import PushNotification, {Importance} from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import type {Consultation} from '../types/consultation';

class NotificationService {
  constructor() {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        notification.finish();
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Medicine Reminders Channel
    PushNotification.createChannel(
      {
        channelId: 'medicine-reminders',
        channelName: 'Medicine Reminders',
        channelDescription: 'Reminders to take your medicine',
        importance: Importance.HIGH,
        vibrate: true,
      },
      created => console.log(`Medicine reminders channel created: ${created}`),
    );

    // Consultation Reminders Channel
    PushNotification.createChannel(
      {
        channelId: 'consultation-reminders',
        channelName: 'Consultation Reminders',
        channelDescription: 'Reminders for upcoming consultations',
        importance: Importance.HIGH,
        vibrate: true,
        playSound: true,
        soundName: 'default',
      },
      created => console.log(`Consultation reminders channel created: ${created}`),
    );

    // Consultation Updates Channel
    PushNotification.createChannel(
      {
        channelId: 'consultation-updates',
        channelName: 'Consultation Updates',
        channelDescription: 'Updates about your consultations',
        importance: Importance.HIGH,
        vibrate: true,
        playSound: true,
        soundName: 'default',
      },
      created => console.log(`Consultation updates channel created: ${created}`),
    );

    // Chat Messages Channel
    PushNotification.createChannel(
      {
        channelId: 'chat-messages',
        channelName: 'Chat Messages',
        channelDescription: 'New messages from doctors',
        importance: Importance.DEFAULT,
        vibrate: true,
      },
      created => console.log(`Chat messages channel created: ${created}`),
    );

    // Initialize FCM
    this.initializeFCM();
  }

  async initializeFCM() {
    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('FCM Authorization status:', authStatus);

        // Get FCM token
        const token = await messaging().getToken();
        console.log('FCM Token:', token);

        // Listen for token refresh
        messaging().onTokenRefresh(token => {
          console.log('FCM Token refreshed:', token);
          // TODO: Update token in Firestore user document
        });

        // Handle foreground messages
        messaging().onMessage(async remoteMessage => {
          console.log('FCM foreground message:', remoteMessage);
          this.handleFCMMessage(remoteMessage);
        });

        // Handle background messages
        messaging().setBackgroundMessageHandler(async remoteMessage => {
          console.log('FCM background message:', remoteMessage);
        });
      }
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  handleFCMMessage(remoteMessage: any) {
    const {notification, data} = remoteMessage;

    if (notification) {
      // Determine channel based on notification type
      let channelId = 'consultation-updates';
      if (data?.type === 'chat') {
        channelId = 'chat-messages';
      } else if (data?.type === 'reminder') {
        channelId = 'consultation-reminders';
      }

      PushNotification.localNotification({
        channelId,
        title: notification.title || 'MediFind',
        message: notification.body || '',
        playSound: true,
        soundName: 'default',
        userInfo: data,
      });
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  scheduleNotification(
    id: string,
    title: string,
    message: string,
    date: Date,
    repeatType?: 'day' | 'week' | 'time',
  ) {
    PushNotification.localNotificationSchedule({
      channelId: 'medicine-reminders',
      id: id,
      title: title,
      message: message,
      date: date,
      allowWhileIdle: true,
      repeatType: repeatType,
      playSound: true,
      soundName: 'default',
    });
  }

  cancelNotification(id: string) {
    PushNotification.cancelLocalNotification(id);
  }

  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  checkPermissions(callback: (permissions: any) => void) {
    PushNotification.checkPermissions(callback);
  }

  requestPermissions() {
    return PushNotification.requestPermissions();
  }

  // Consultation-specific notifications
  scheduleConsultationReminder(consultation: Consultation) {
    const reminderTime = new Date(consultation.scheduledTime);
    reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before

    // Only schedule if reminder time is in the future
    if (reminderTime > new Date()) {
      PushNotification.localNotificationSchedule({
        channelId: 'consultation-reminders',
        id: `consultation-reminder-${consultation.id}`,
        title: 'Consultation Reminder',
        message: `Your consultation with Dr. ${consultation.doctorName} starts in 1 hour`,
        date: reminderTime,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        userInfo: {
          consultationId: consultation.id,
          type: 'reminder',
        },
      });

      console.log(`Scheduled reminder for consultation ${consultation.id}`);
    }
  }

  sendBookingConfirmation(consultation: Consultation) {
    PushNotification.localNotification({
      channelId: 'consultation-updates',
      title: 'Booking Confirmed',
      message: `Your consultation with Dr. ${consultation.doctorName} is confirmed for ${consultation.scheduledTime.toLocaleString()}`,
      playSound: true,
      soundName: 'default',
      userInfo: {
        consultationId: consultation.id,
        type: 'booking-confirmed',
      },
    });
  }

  sendDoctorJoinedNotification(consultation: Consultation) {
    PushNotification.localNotification({
      channelId: 'consultation-updates',
      title: 'Doctor Joined',
      message: `Dr. ${consultation.doctorName} has joined the consultation`,
      playSound: true,
      soundName: 'default',
      userInfo: {
        consultationId: consultation.id,
        type: 'doctor-joined',
      },
    });
  }

  sendPrescriptionNotification(consultationId: string, doctorName: string) {
    PushNotification.localNotification({
      channelId: 'consultation-updates',
      title: 'Prescription Received',
      message: `You have received a new prescription from Dr. ${doctorName}`,
      playSound: true,
      soundName: 'default',
      userInfo: {
        consultationId,
        type: 'prescription-received',
      },
    });
  }

  sendChatMessageNotification(
    consultationId: string,
    senderName: string,
    message: string,
  ) {
    PushNotification.localNotification({
      channelId: 'chat-messages',
      title: senderName,
      message: message.length > 100 ? `${message.substring(0, 100)}...` : message,
      playSound: true,
      soundName: 'default',
      userInfo: {
        consultationId,
        type: 'chat',
      },
    });
  }

  cancelConsultationReminder(consultationId: string) {
    PushNotification.cancelLocalNotification(`consultation-reminder-${consultationId}`);
  }
}

export default new NotificationService();
