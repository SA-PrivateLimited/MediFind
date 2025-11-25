import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore, Medicine} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';
import {formatDate} from '../utils/helpers';

interface HistoryScreenProps {
  navigation: any;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({navigation}) => {
  const {isDarkMode, searchHistory, clearHistory} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all search history?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearHistory,
        },
      ],
    );
  };

  const renderItem = ({item}: {item: Medicine}) => (
    <TouchableOpacity
      style={[styles.historyItem, {backgroundColor: theme.card}]}
      onPress={() => navigation.navigate('Details', {medicine: item})}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleContainer}>
          <Icon name="medical" size={20} color={theme.primary} />
          <Text style={[styles.itemName, {color: theme.text}]}>
            {item.name}
          </Text>
        </View>
        <Text style={[styles.timestamp, {color: theme.textSecondary}]}>
          {formatDate(new Date(item.timestamp))}
        </Text>
      </View>
      <Text
        style={[styles.itemDescription, {color: theme.textSecondary}]}
        numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={[styles.header, {backgroundColor: theme.card}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>
          Search History
        </Text>
        {searchHistory.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={[styles.clearButton, {color: theme.error}]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="time-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
            No search history yet
          </Text>
          <Text style={[styles.emptySubtext, {color: theme.textSecondary}]}>
            Your searched medicines will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchHistory}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    ...commonStyles.shadowSmall,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...commonStyles.shadowSmall,
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
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
});

export default HistoryScreen;
