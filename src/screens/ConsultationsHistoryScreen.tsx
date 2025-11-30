import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {useStore} from '../store';
import {lightTheme, darkTheme} from '../utils/theme';
import type {Consultation, ConsultationStatus} from '../types/consultation';
import consultationService from '../services/consultationService';
import ConsultationCard from '../components/ConsultationCard';
import EmptyState from '../components/EmptyState';

interface ConsultationsHistoryScreenProps {
  navigation: any;
}

const ConsultationsHistoryScreen: React.FC<ConsultationsHistoryScreenProps> = ({
  navigation,
}) => {
  const {isDarkMode, currentUser, consultations, setConsultations, setRedirectAfterLogin} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ConsultationStatus>('all');
  const [filteredConsultations, setFilteredConsultations] = useState<Consultation[]>([]);

  const filters: Array<{label: string; value: 'all' | ConsultationStatus}> = [
    {label: 'All', value: 'all'},
    {label: 'Scheduled', value: 'scheduled'},
    {label: 'Completed', value: 'completed'},
    {label: 'Cancelled', value: 'cancelled'},
  ];

  useEffect(() => {
    if (currentUser) {
      loadConsultations();
    }
  }, [currentUser]);

  useEffect(() => {
    filterConsultations();
  }, [consultations, selectedFilter]);

  const loadConsultations = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const userConsultations = await consultationService.fetchUserConsultations(
        currentUser.id,
      );
      await setConsultations(userConsultations);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentUser) return;

    setRefreshing(true);
    try {
      const userConsultations = await consultationService.fetchUserConsultations(
        currentUser.id,
      );
      await setConsultations(userConsultations);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const filterConsultations = () => {
    if (selectedFilter === 'all') {
      setFilteredConsultations(consultations);
    } else {
      setFilteredConsultations(
        consultations.filter(c => c.status === selectedFilter),
      );
    }
  };

  const handleConsultationPress = (consultation: Consultation) => {
    // Navigate to consultation details (to be implemented)
    Alert.alert('Consultation Details', `ID: ${consultation.id}`);
  };

  const handleJoinCall = (consultation: Consultation) => {
    // Video calling feature coming soon
    Alert.alert('Video Call', 'Video calling feature will be available soon!');
  };

  const handleViewPrescription = (consultation: Consultation) => {
    if (consultation.prescriptionId) {
      // Navigate to prescription details (to be implemented in Phase 7)
      Alert.alert('Prescription', `Prescription ID: ${consultation.prescriptionId}`);
    }
  };

  const handleChat = (consultation: Consultation) => {
    // Navigate to chat screen (to be implemented in Phase 6)
    Alert.alert('Chat', `Chat with ${consultation.doctorName}`);
  };

  const renderFilter = ({item}: {item: typeof filters[0]}) => {
    const isSelected = item.value === selectedFilter;
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? theme.primary : theme.card,
            borderColor: isSelected ? theme.primary : theme.border,
          },
        ]}
        onPress={() => setSelectedFilter(item.value)}>
        <Text
          style={[
            styles.filterText,
            {color: isSelected ? '#fff' : theme.text},
          ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderConsultation = ({item}: {item: Consultation}) => (
    <ConsultationCard
      consultation={item}
      onPress={() => handleConsultationPress(item)}
      onJoinCall={() => handleJoinCall(item)}
      onViewPrescription={() => handleViewPrescription(item)}
      onChat={() => handleChat(item)}
    />
  );

  if (!currentUser) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          {backgroundColor: theme.background},
        ]}>
        <EmptyState
          icon="person-outline"
          title="Login Required"
          message="Please login to view your consultations"
        />
        <TouchableOpacity
          style={[styles.button, {backgroundColor: theme.primary}]}
          onPress={() => {
            setRedirectAfterLogin({route: 'ConsultationsHistory'});
            navigation.navigate('Login');
          }}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          {backgroundColor: theme.background},
        ]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, {color: theme.textSecondary}]}>
          Loading consultations...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          renderItem={renderFilter}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Consultations List */}
      {filteredConsultations.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Consultations"
          message={
            selectedFilter === 'all'
              ? 'You have no consultations yet. Book your first consultation!'
              : `No ${selectedFilter} consultations`
          }
        />
      ) : (
        <FlatList
          data={filteredConsultations}
          renderItem={renderConsultation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={[styles.resultCount, {color: theme.textSecondary}]}>
                {filteredConsultations.length} consultation
                {filteredConsultations.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  filtersContainer: {
    marginVertical: 12,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  listHeader: {
    marginBottom: 8,
  },
  resultCount: {
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConsultationsHistoryScreen;
