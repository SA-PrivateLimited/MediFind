import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore, Medicine} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';

interface FavoritesScreenProps {
  navigation: any;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({navigation}) => {
  const {isDarkMode, favorites, toggleFavorite} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const renderItem = ({item}: {item: Medicine}) => (
    <View style={[styles.favoriteItem, {backgroundColor: theme.card}]}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => navigation.navigate('Details', {medicine: item})}>
        <View style={styles.itemHeader}>
          <Icon name="medical" size={20} color={theme.primary} />
          <Text style={[styles.itemName, {color: theme.text}]}>{item.name}</Text>
        </View>
        <Text
          style={[styles.itemDescription, {color: theme.textSecondary}]}
          numberOfLines={2}>
          {item.description}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => toggleFavorite(item)}
        style={styles.favoriteButton}>
        <Icon name="heart" size={24} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="heart-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
            No favorites yet
          </Text>
          <Text style={[styles.emptySubtext, {color: theme.textSecondary}]}>
            Save medicines for quick access
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
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
  list: {
    padding: 20,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...commonStyles.shadowSmall,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 12,
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

export default FavoritesScreen;
