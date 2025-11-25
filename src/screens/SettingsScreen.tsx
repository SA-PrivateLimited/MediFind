import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';
import {APP_NAME, COPYRIGHT_OWNER} from '@env';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({navigation}) => {
  const {isDarkMode, toggleTheme, clearHistory, favorites} = useStore();
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

  const handleAbout = () => {
    Alert.alert(
      'About MediFind',
      `Version: 1.0.0\n\nMediFind is a comprehensive medicine information app that helps you search for medicines, get detailed information, and manage your medication schedule.\n\n© 2025 ${COPYRIGHT_OWNER || 'SA-PrivateLimited'}. All rights reserved.`,
      [{text: 'OK'}],
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'MediFind respects your privacy. All data is stored locally on your device. We do not collect or share your personal information.\n\nOpenAI API is used for enhanced medicine information, subject to OpenAI\'s privacy policy.',
      [{text: 'OK'}],
    );
  };

  const handleTerms = () => {
    Alert.alert(
      'Terms of Service',
      'MediFind provides medicine information for educational purposes only. Always consult healthcare professionals for medical advice.\n\nBy using this app, you agree to use the information responsibly and understand that it is not a substitute for professional medical advice.',
      [{text: 'OK'}],
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, {backgroundColor: theme.card}]}
      onPress={onPress}
      disabled={!onPress && !rightComponent}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={22} color={theme.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, {color: theme.text}]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, {color: theme.textSecondary}]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (
        onPress && <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.background}]}
      contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: theme.textSecondary}]}>
          APPEARANCE
        </Text>
        <SettingItem
          icon="moon"
          title="Dark Mode"
          subtitle={isDarkMode ? 'Enabled' : 'Disabled'}
          rightComponent={
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{false: theme.border, true: theme.primary}}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: theme.textSecondary}]}>
          DATA
        </Text>
        <SettingItem
          icon="time"
          title="Search History"
          onPress={() => navigation.navigate('History')}
        />
        <SettingItem
          icon="heart"
          title="Favorites"
          subtitle={`${favorites.length} saved`}
          onPress={() => navigation.navigate('Favorites')}
        />
        <SettingItem
          icon="trash-outline"
          title="Clear History"
          subtitle="Remove all search history"
          onPress={handleClearHistory}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: theme.textSecondary}]}>
          INFORMATION
        </Text>
        <SettingItem
          icon="information-circle"
          title="About"
          subtitle="App version and information"
          onPress={handleAbout}
        />
        <SettingItem
          icon="shield-checkmark"
          title="Privacy Policy"
          onPress={handlePrivacy}
        />
        <SettingItem
          icon="document-text"
          title="Terms of Service"
          onPress={handleTerms}
        />
      </View>

      <View style={styles.footer}>
        <Icon name="medical" size={32} color={theme.primary} />
        <Text style={[styles.appName, {color: theme.text}]}>MediFind</Text>
        <Text style={[styles.version, {color: theme.textSecondary}]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.copyright, {color: theme.textSecondary}]}>
          © 2025 {COPYRIGHT_OWNER || 'SA-PrivateLimited'}
        </Text>
        <Text style={[styles.copyright, {color: theme.textSecondary}]}>
          All rights reserved
        </Text>
        <View style={styles.disclaimer}>
          <Icon name="alert-circle-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.disclaimerText, {color: theme.textSecondary}]}>
            For educational purposes only. Always consult healthcare professionals.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...commonStyles.shadowSmall,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  version: {
    fontSize: 14,
    marginTop: 4,
  },
  copyright: {
    fontSize: 12,
    marginTop: 4,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SettingsScreen;
