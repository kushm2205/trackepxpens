import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {db} from '../services/firebase';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../types/types';

type ChatScreenFriendRouteProp = RouteProp<
  RootStackParamList,
  'ChatScreenFriend'
>;

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  senderName: string;
}

const ChatScreenFriend = () => {
  const route = useRoute<ChatScreenFriendRouteProp>();
  const {friend} = route.params;
  const authState = useSelector((state: RootState) => state.auth);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const chatId = [authState.userId, friend.userId].sort().join('_');

  useEffect(() => {
    const fetchUserName = async () => {
      if (authState.userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authState.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || '');
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
      }
    };
    fetchUserName();
  }, [authState.userId]);

  useEffect(() => {
    const q = query(
      collection(db, 'friends', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (message.trim() === '') return;

    try {
      await addDoc(collection(db, 'friends', chatId, 'messages'), {
        text: message,
        senderId: authState.userId,
        receiverId: friend.userId,
        senderName: userName,
        timestamp: serverTimestamp(),
      });
      setMessage('');
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({animated: true});
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderItem = ({item}: {item: Message}) => {
    const isCurrentUser = item.senderId === authState.userId;
    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.myMessage : styles.otherMessage,
        ]}>
        {!isCurrentUser && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp?.toDate()?.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.header}>
          <Image
            source={
              friend.photo
                ? {uri: friend.photo}
                : require('../assets/download.png')
            }
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>{friend.name}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
        />

        <View style={styles.inputWrapper}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  messageList: {
    padding: 10,
    flexGrow: 1,
  },
  messageBubble: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 10,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e4e6eb',
  },
  senderName: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#555',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
  },
});

export default ChatScreenFriend;
