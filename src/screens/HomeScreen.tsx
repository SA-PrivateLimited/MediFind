import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore, Medicine} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';
import {searchMedicine} from '../services/medicineService';
import {generateId, cleanMedicineName} from '../utils/helpers';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const {isDarkMode, searchHistory, addToHistory} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a medicine name');
      return;
    }

    setLocalLoading(true);
    try {
      const cleanedName = cleanMedicineName(searchQuery);
      const data = await searchMedicine(cleanedName);

      const medicine: Medicine = {
        id: generateId(),
        name: data.name,
        description: data.description,
        ingredients: data.ingredients,
        uses: data.uses,
        sideEffects: data.sideEffects,
        dosage: data.dosage,
        warnings: data.warnings,
        timestamp: Date.now(),
      };

      await addToHistory(medicine);
      navigation.navigate('Details', {medicine});
      setSearchQuery('');
    } catch (error: any) {
      Alert.alert(
        'Not Found',
        error.message || 'Medicine not found. Try asking AI for more details.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Ask AI',
            onPress: () => {
              navigation.navigate('AIAssistant', {medicineName: searchQuery});
            },
          },
        ],
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const renderHistoryItem = ({item}: {item: Medicine}) => (
    <TouchableOpacity
      style={[styles.historyItem, {backgroundColor: theme.card}]}
      onPress={() => navigation.navigate('Details', {medicine: item})}>
      <View style={styles.historyContent}>
        <Icon name="medical" size={24} color={theme.primary} />
        <View style={styles.historyText}>
          <Text style={[styles.historyName, {color: theme.text}]}>
            {item.name}
          </Text>
          <Text
            style={[styles.historyDescription, {color: theme.textSecondary}]}
            numberOfLines={1}>
            {item.description}
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.text}]}>MediFind</Text>
        <Text style={[styles.subtitle, {color: theme.textSecondary}]}>
          Search medicines and get detailed information
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, {backgroundColor: theme.card}]}>
          <Icon
            name="search"
            size={20}
            color={theme.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, {color: theme.text}]}
            placeholder="Enter medicine name..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            editable={!localLoading}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.searchButton,
            {backgroundColor: theme.primary},
            localLoading && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={localLoading}>
          {localLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <View style={styles.historySectionHeader}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>
            Recent Searches
          </Text>
          {searchHistory.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('History')}>
              <Text style={[styles.viewAll, {color: theme.primary}]}>
                View All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {searchHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="time-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
              No search history yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchHistory.slice(0, 5)}
            keyExtractor={item => item.id}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.historyList}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...commonStyles.shadowSmall,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  searchButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...commonStyles.shadowMedium,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...commonStyles.shadowSmall,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyText: {
    marginLeft: 12,
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});

export default HomeScreen;
