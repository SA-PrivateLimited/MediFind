import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';
import type {Doctor, TimeSlot} from '../types/consultation';
import consultationService from '../services/consultationService';
import notificationService from '../services/notificationService';
import TimeSlotPicker from '../components/TimeSlotPicker';

interface BookingScreenProps {
  navigation: any;
  route: {
    params: {
      doctor: Doctor;
    };
  };
}

const BookingScreen: React.FC<BookingScreenProps> = ({navigation, route}) => {
  const {doctor} = route.params;
  const {isDarkMode, currentUser, addConsultation, setRedirectAfterLogin} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get max date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableSlots = async (date: string) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const slots = await consultationService.fetchDoctorAvailability(
        doctor.id,
        date,
      );
      setAvailableSlots(slots);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookConsultation = async () => {
    if (!currentUser) {
      Alert.alert(
        'Login Required',
        'Please login to book a consultation',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Login',
            onPress: () => {
              setRedirectAfterLogin({route: 'Booking', params: {doctor}});
              navigation.navigate('Login');
            },
          },
        ]
      );
      return;
    }

    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    // Create scheduled time from date and slot
    const [hours, minutes] = selectedSlot.startTime.split(':');
    const scheduledTime = new Date(selectedDate);
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    setLoading(true);
    try {
      const consultation = await consultationService.bookConsultation(
        {
          doctorId: doctor.id,
          doctorName: doctor.name,
          doctorSpecialization: doctor.specialization,
          patientId: currentUser.id,
          patientName: currentUser.name,
          scheduledTime,
          consultationFee: doctor.consultationFee,
          symptoms: symptoms.trim(),
          notes: notes.trim(),
        },
        selectedSlot,
        selectedDate,
      );

      await addConsultation(consultation);

      // Send booking confirmation notification
      notificationService.sendBookingConfirmation(consultation);

      // Schedule reminder for 1 hour before consultation
      notificationService.scheduleConsultationReminder(consultation);

      Alert.alert(
        'Success',
        'Consultation booked successfully! You will receive a reminder 1 hour before your appointment.',
        [
          {
            text: 'View Consultations',
            onPress: () => {
              navigation.navigate('Consultations', {
                screen: 'ConsultationsHistory',
              });
            },
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.background}]}
      contentContainerStyle={styles.content}>
      {/* Doctor Info */}
      <View
        style={[
          styles.doctorCard,
          {backgroundColor: theme.card},
          commonStyles.shadowSmall,
        ]}>
        <Text style={[styles.doctorName, {color: theme.text}]}>
          Dr. {doctor.name}
        </Text>
        <Text style={[styles.specialization, {color: theme.textSecondary}]}>
          {doctor.specialization}
        </Text>
        <View style={styles.feeRow}>
          <Icon name="cash-outline" size={16} color={theme.primary} />
          <Text style={[styles.fee, {color: theme.primary}]}>
            Consultation Fee: ₹{doctor.consultationFee}
          </Text>
        </View>
      </View>

      {/* Calendar */}
      <View
        style={[
          styles.section,
          {backgroundColor: theme.card},
          commonStyles.shadowSmall,
        ]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          Select Date
        </Text>
        <Calendar
          minDate={getTodayDate()}
          maxDate={getMaxDate()}
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: theme.primary,
            },
          }}
          theme={{
            backgroundColor: theme.card,
            calendarBackground: theme.card,
            textSectionTitleColor: theme.textSecondary,
            selectedDayBackgroundColor: theme.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: theme.primary,
            dayTextColor: theme.text,
            textDisabledColor: theme.border,
            monthTextColor: theme.text,
            arrowColor: theme.primary,
          }}
        />
      </View>

      {/* Time Slots */}
      {selectedDate && (
        <View
          style={[
            styles.section,
            {backgroundColor: theme.card},
            commonStyles.shadowSmall,
          ]}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>
            Select Time Slot
          </Text>

          {loadingSlots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, {color: theme.textSecondary}]}>
                Loading available slots...
              </Text>
            </View>
          ) : (
            <TimeSlotPicker
              slots={availableSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          )}
        </View>
      )}

      {/* Patient Details */}
      {selectedSlot && (
        <View
          style={[
            styles.section,
            {backgroundColor: theme.card},
            commonStyles.shadowSmall,
          ]}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>
            Patient Details
          </Text>

          <Text style={[styles.label, {color: theme.textSecondary}]}>
            Symptoms (Optional)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
            placeholder="Describe your symptoms..."
            placeholderTextColor={theme.textSecondary}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={[styles.label, {color: theme.textSecondary}]}>
            Notes (Optional)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
            placeholder="Any additional notes..."
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Book Button */}
      {selectedSlot && (
        <TouchableOpacity
          style={[
            styles.bookButton,
            {backgroundColor: theme.primary},
            loading && styles.buttonDisabled,
          ]}
          onPress={handleBookConsultation}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="calendar" size={20} color="#fff" />
              <Text style={styles.bookButtonText}>
                Book Consultation - ₹{doctor.consultationFee}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  doctorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fee: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default BookingScreen;
