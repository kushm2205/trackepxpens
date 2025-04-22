import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import {db} from '../services/firebase';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';

const ChatScreen = ({route}: any) => {
  const {groupId, groupName} = route.params;
  const [message, setMessage] = useState('');
  const navigation = useNavigation();
  const [messages, setMessages] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const authState = useSelector((state: RootState) => state.auth);

  // Fetch messages from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    console.log(q);

    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Fetch current user's name from Firestore
  useEffect(() => {
    const fetchUserName = async () => {
      if (authState.userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authState.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || '');
            console.log('Fetched user name:', userData.name);
          } else {
            console.log('User document does not exist');
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
      }
    };

    fetchUserName();
  }, [authState.userId]);

  const handleSend = async () => {
    if (message.trim() === '') return;

    try {
      // Use the fetched userName instead of relying on authState.name
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        text: message,
        senderId: authState.userId,
        senderName: userName || 'Anonymous', // Use the fetched userName
        createdAt: new Date(),
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderItem = ({item}: {item: any}) => {
    const isCurrentUser = item.senderId === authState.userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}>
        {!isCurrentUser && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
            ]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt?.seconds * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerText}>{groupName}</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContainer}
          inverted={false}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={message.trim() === ''}>
            <Icon
              name="send"
              size={24}
              color={message.trim() === '' ? '#ccc' : '#007AFF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    flexDirection: 'row',

    alignItems: 'center',
  },

  headerText: {
    fontSize: 20,
    fontWeight: 'bold',

    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  messagesContainer: {
    padding: 10,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    borderTopRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#333',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 8,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
