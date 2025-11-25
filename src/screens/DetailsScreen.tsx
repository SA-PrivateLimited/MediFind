import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import {useStore, Medicine} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';

interface DetailsScreenProps {
  navigation: any;
  route: {
    params: {
      medicine: Medicine;
    };
  };
}

const DetailsScreen: React.FC<DetailsScreenProps> = ({navigation, route}) => {
  const {medicine} = route.params;
  const {isDarkMode, favorites, toggleFavorite} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const isFavorite = favorites.some(f => f.id === medicine.id);

  const handleShare = async () => {
    try {
      const shareContent = `
*${medicine.name}*

*Description:*
${medicine.description}

*Ingredients:*
${medicine.ingredients.join(', ')}

*Uses:*
${medicine.uses}

*Side Effects:*
${medicine.sideEffects}

*Dosage:*
${medicine.dosage}

*Warnings:*
${medicine.warnings}

---
Shared from MediFind App
© 2025 SA-PrivateLimited
      `.trim();

      await Share.open({
        message: shareContent,
        title: `Medicine Info: ${medicine.name}`,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share medicine information');
      }
    }
  };

  const handleAskAI = () => {
    navigation.navigate('AIAssistant', {medicineName: medicine.name});
  };

  const InfoSection = ({
    title,
    content,
    icon,
  }: {
    title: string;
    content: string | string[];
    icon: string;
  }) => (
    <View style={[styles.section, {backgroundColor: theme.card}]}>
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.iconContainer,
            {backgroundColor: theme.primary + '20'},
          ]}>
          <Icon name={icon} size={22} color={theme.primary} />
        </View>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>{title}</Text>
      </View>
      <View style={styles.contentWrapper}>
        <Text style={[styles.sectionContent, {color: theme.textSecondary}]}>
          {Array.isArray(content) ? content.join(', ') : content}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={[styles.header, {backgroundColor: theme.primary}]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => toggleFavorite(medicine)}
              style={styles.iconButton}>
              <Icon
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
              <Icon name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <InfoSection
          title="Description"
          content={medicine.description}
          icon="document-text"
        />

        <InfoSection
          title="Ingredients"
          content={medicine.ingredients}
          icon="flask"
        />

        <InfoSection
          title="Uses & Indications"
          content={medicine.uses}
          icon="medkit"
        />

        <InfoSection
          title="Side Effects"
          content={medicine.sideEffects}
          icon="warning"
        />

        <InfoSection
          title="Dosage Information"
          content={medicine.dosage}
          icon="water"
        />

        <InfoSection
          title="Warnings & Precautions"
          content={medicine.warnings}
          icon="alert-circle"
        />

        <TouchableOpacity
          style={[styles.aiButton, {backgroundColor: theme.secondary}]}
          onPress={handleAskAI}>
          <Icon name="chatbubbles" size={20} color="#FFFFFF" />
          <Text style={styles.aiButtonText}>Ask AI for More Details</Text>
        </TouchableOpacity>

        <View style={styles.disclaimer}>
          <Icon name="shield-checkmark" size={16} color={theme.textSecondary} />
          <Text style={[styles.disclaimerText, {color: theme.textSecondary}]}>
            This information is for educational purposes only. Always consult a
            healthcare professional before taking any medication.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    ...commonStyles.shadowMedium,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  medicineName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...commonStyles.shadowSmall,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  contentWrapper: {
    marginLeft: 52,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    ...commonStyles.shadowMedium,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disclaimer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default DetailsScreen;
