import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useStore, Reminder} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';
import {generateId, formatDate} from '../utils/helpers';
import NotificationService from '../services/notificationService';

interface RemindersScreenProps {
  navigation: any;
}

const RemindersScreen: React.FC<RemindersScreenProps> = ({navigation}) => {
  const {isDarkMode, reminders, addReminder, updateReminder, deleteReminder} =
    useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [modalVisible, setModalVisible] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [frequency, setFrequency] = useState<'daily' | 'twice' | 'thrice' | 'custom'>('daily');
  const [notes, setNotes] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleAddReminder = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Error', 'Please enter medicine name');
      return;
    }

    // Request notification permissions
    const permissions = await NotificationService.requestPermissions();
    if (!permissions.alert) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications to set reminders',
      );
      return;
    }

    const reminder: Reminder = {
      id: generateId(),
      medicineName: medicineName.trim(),
      time: selectedTime,
      frequency,
      notes: notes.trim(),
      enabled: true,
    };

    await addReminder(reminder);

    // Schedule notification
    NotificationService.scheduleNotification(
      reminder.id,
      'Medicine Reminder',
      `Time to take ${reminder.medicineName}`,
      reminder.time,
      frequency === 'daily' ? 'day' : undefined,
    );

    setModalVisible(false);
    resetForm();
    Alert.alert('Success', 'Reminder added successfully');
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    const newEnabled = !reminder.enabled;
    await updateReminder(reminder.id, {enabled: newEnabled});

    if (newEnabled) {
      NotificationService.scheduleNotification(
        reminder.id,
        'Medicine Reminder',
        `Time to take ${reminder.medicineName}`,
        reminder.time,
        reminder.frequency === 'daily' ? 'day' : undefined,
      );
    } else {
      NotificationService.cancelNotification(reminder.id);
    }
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Delete reminder for ${reminder.medicineName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteReminder(reminder.id);
            NotificationService.cancelNotification(reminder.id);
          },
        },
      ],
    );
  };

  const resetForm = () => {
    setMedicineName('');
    setSelectedTime(new Date());
    setFrequency('daily');
    setNotes('');
  };

  const renderReminder = ({item}: {item: Reminder}) => (
    <View style={[styles.reminderItem, {backgroundColor: theme.card}]}>
      <View style={styles.reminderContent}>
        <View style={styles.reminderHeader}>
          <Icon
            name={item.enabled ? 'notifications' : 'notifications-off'}
            size={20}
            color={item.enabled ? theme.primary : theme.textSecondary}
          />
          <Text style={[styles.medicineName, {color: theme.text}]}>
            {item.medicineName}
          </Text>
        </View>
        <View style={styles.reminderDetails}>
          <Icon name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.reminderTime, {color: theme.textSecondary}]}>
            {formatDate(new Date(item.time))} • {item.frequency}
          </Text>
        </View>
        {item.notes && (
          <Text style={[styles.reminderNotes, {color: theme.textSecondary}]}>
            {item.notes}
          </Text>
        )}
      </View>
      <View style={styles.reminderActions}>
        <Switch
          value={item.enabled}
          onValueChange={() => handleToggleReminder(item)}
          trackColor={{false: theme.border, true: theme.primary}}
          thumbColor="#FFFFFF"
        />
        <TouchableOpacity
          onPress={() => handleDeleteReminder(item)}
          style={styles.deleteButton}>
          <Icon name="trash-outline" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="notifications-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
            No reminders set
          </Text>
          <Text style={[styles.emptySubtext, {color: theme.textSecondary}]}>
            Never miss your medicine dose
          </Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={item => item.id}
          renderItem={renderReminder}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, {backgroundColor: theme.primary}]}
        onPress={() => setModalVisible(true)}>
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.text}]}>
                Add Reminder
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, {backgroundColor: theme.background, color: theme.text, borderColor: theme.border}]}
              placeholder="Medicine name"
              placeholderTextColor={theme.placeholder}
              value={medicineName}
              onChangeText={setMedicineName}
            />

            <TouchableOpacity
              style={[styles.input, {backgroundColor: theme.background, borderColor: theme.border, justifyContent: 'center'}]}
              onPress={() => setShowTimePicker(true)}>
              <Text style={{color: theme.text}}>
                {formatDate(selectedTime)}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={false}
                onChange={(event, date) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (date) setSelectedTime(date);
                }}
              />
            )}

            <View style={styles.frequencyContainer}>
              {['daily', 'twice', 'thrice'].map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyButton,
                    {borderColor: theme.border},
                    frequency === freq && {backgroundColor: theme.primary},
                  ]}
                  onPress={() => setFrequency(freq as any)}>
                  <Text
                    style={[
                      styles.frequencyText,
                      {color: frequency === freq ? '#FFFFFF' : theme.text},
                    ]}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.notesInput, {backgroundColor: theme.background, color: theme.text, borderColor: theme.border}]}
              placeholder="Notes (optional)"
              placeholderTextColor={theme.placeholder}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              style={[styles.addButton, {backgroundColor: theme.primary}]}
              onPress={handleAddReminder}>
              <Text style={styles.addButtonText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  reminderItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...commonStyles.shadowSmall,
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reminderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 12,
    marginLeft: 4,
  },
  reminderNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  reminderActions: {
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButton: {
    marginTop: 8,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...commonStyles.shadowLarge,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  frequencyButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RemindersScreen;
