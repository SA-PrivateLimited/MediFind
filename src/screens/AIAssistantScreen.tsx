import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore} from '../store';
import {lightTheme, darkTheme, commonStyles} from '../utils/theme';
import {getMedicineInfoFromOpenAI} from '../services/medicineService';

interface AIAssistantScreenProps {
  navigation: any;
  route: {
    params?: {
      medicineName?: string;
    };
  };
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({
  navigation,
  route,
}) => {
  const medicineName = route.params?.medicineName || '';
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const {isDarkMode} = useStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await getMedicineInfoFromOpenAI(
        medicineName || 'general medicine information',
        question,
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get response from AI');
    } finally {
      setLoading(false);
    }
  };

  const handleGetFullInfo = async () => {
    if (!medicineName) {
      Alert.alert('Error', 'No medicine specified');
      return;
    }

    setLoading(true);
    try {
      const response = await getMedicineInfoFromOpenAI(medicineName);

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: response,
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages([aiMessage]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get information from AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={[styles.header, {backgroundColor: theme.card}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, {color: theme.text}]}>
            AI Assistant
          </Text>
          {medicineName && (
            <Text style={[styles.headerSubtitle, {color: theme.textSecondary}]}>
              About: {medicineName}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}>
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="chatbubbles-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
              Ask me anything about {medicineName || 'medicines'}
            </Text>
            {medicineName && (
              <TouchableOpacity
                style={[styles.quickButton, {backgroundColor: theme.primary}]}
                onPress={handleGetFullInfo}
                disabled={loading}>
                <Text style={styles.quickButtonText}>
                  Get Full Information
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {messages.map(message => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser
                ? [styles.userBubble, {backgroundColor: theme.primary}]
                : [styles.aiBubble, {backgroundColor: theme.card}],
            ]}>
            {!message.isUser && (
              <Icon
                name="sparkles"
                size={16}
                color={theme.primary}
                style={styles.aiIcon}
              />
            )}
            <Text
              style={[
                styles.messageText,
                {color: message.isUser ? '#FFFFFF' : theme.text},
              ]}>
              {message.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.loadingBubble, {backgroundColor: theme.card}]}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.loadingText, {color: theme.textSecondary}]}>
              AI is thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, {backgroundColor: theme.card}]}>
        <TextInput
          style={[styles.input, {color: theme.text}]}
          placeholder="Ask a question..."
          placeholderTextColor={theme.placeholder}
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={500}
          editable={!loading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {backgroundColor: theme.primary},
            loading && styles.sendButtonDisabled,
          ]}
          onPress={handleAskQuestion}
          disabled={loading || !question.trim()}>
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    ...commonStyles.shadowSmall,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  quickButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    ...commonStyles.shadowSmall,
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  aiIcon: {
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    ...commonStyles.shadowMedium,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default AIAssistantScreen;
