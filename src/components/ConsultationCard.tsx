import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';
import type {Consultation} from '../types/consultation';
import StatusBadge from './StatusBadge';

interface ConsultationCardProps {
  consultation: Consultation;
  onPress: () => void;
  onJoinCall?: () => void;
  onViewPrescription?: () => void;
  onChat?: () => void;
}

const ConsultationCard: React.FC<ConsultationCardProps> = ({
  consultation,
  onPress,
  onJoinCall,
  onViewPrescription,
  onChat,
}) => {
  const {isDarkMode} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canJoinCall = () => {
    if (consultation.status !== 'scheduled') return false;
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    // Can join 15 minutes before scheduled time
    return timeDiff <= 15 * 60 * 1000 && timeDiff > -30 * 60 * 1000;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {backgroundColor: theme.card, borderColor: theme.border},
        commonStyles.shadowMedium,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.doctorName, {color: theme.text}]}>
            Dr. {consultation.doctorName}
          </Text>
          <Text style={[styles.specialization, {color: theme.textSecondary}]}>
            {consultation.doctorSpecialization}
          </Text>
        </View>
        <StatusBadge status={consultation.status} />
      </View>

      {/* Date & Time */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeItem}>
          <Icon name="calendar-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.dateTimeText, {color: theme.text}]}>
            {formatDate(consultation.scheduledTime)}
          </Text>
        </View>
        <View style={styles.dateTimeItem}>
          <Icon name="time-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.dateTimeText, {color: theme.text}]}>
            {formatTime(consultation.scheduledTime)}
          </Text>
        </View>
      </View>

      {/* Fee */}
      <View style={styles.feeRow}>
        <Icon name="cash-outline" size={16} color={theme.primary} />
        <Text style={[styles.feeText, {color: theme.primary}]}>
          ₹{consultation.consultationFee}
        </Text>
      </View>

      {/* Actions */}
      {(canJoinCall() || consultation.prescriptionId || consultation.status === 'completed') && (
        <View style={styles.actions}>
          {canJoinCall() && onJoinCall && (
            <TouchableOpacity
              style={[styles.actionButton, {backgroundColor: theme.primary}]}
              onPress={onJoinCall}>
              <Icon name="videocam" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Join Call</Text>
            </TouchableOpacity>
          )}

          {consultation.prescriptionId && onViewPrescription && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                {borderColor: theme.primary},
              ]}
              onPress={onViewPrescription}>
              <Icon name="document-text-outline" size={16} color={theme.primary} />
              <Text style={[styles.secondaryButtonText, {color: theme.primary}]}>
                Prescription
              </Text>
            </TouchableOpacity>
          )}

          {onChat && consultation.status !== 'cancelled' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.iconOnlyButton,
                {borderColor: theme.border},
              ]}
              onPress={onChat}>
              <Icon name="chatbubble-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 13,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  dateTimeText: {
    fontSize: 14,
    marginLeft: 6,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  iconOnlyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ConsultationCard;
