import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchGroups, deleteGroup, removeGroup} from '../Redux/slice/GroupSlice';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, group} from '../types/types';
import {RootState, AppDispatch} from '../Redux/store';
import {auth, db} from '../services/firebase';
import {
  GestureHandlerRootView,
  Swipeable,
  RectButton,
  Pressable,
} from 'react-native-gesture-handler';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';

const defaultGroupImage = require('../assets/download.jpeg');
type GroupScreenProp = StackNavigationProp<RootStackParamList, 'GroupScreen'>;

const GroupScreen = () => {
  const [loader, setLoader] = useState(true);

  const dispatch = useDispatch<AppDispatch>();
  const {groups, loading, error} = useSelector(
    (state: RootState) => state.group,
  );
  const authState = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<GroupScreenProp>();
  const [retryAttempt, setRetryAttempt] = useState(0);

  const loadGroups = useCallback(() => {
    if (authState.isAuthenticated && authState.userId) {
      setLoader(true);
      dispatch(fetchGroups(authState.userId))
        .then(() => setLoader(false))
        .catch(() => setLoader(false));
    }
  }, [authState.isAuthenticated, authState.userId, dispatch]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups, retryAttempt]);

  const handleCreateGroupPress = () => {
    navigation.navigate('CreateGroup');
  };

  const handleRetry = () => {
    setRetryAttempt(prev => prev + 1);
  };

  const handleDeleteGroup = async (groupId: string) => {
    Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const batch = writeBatch(db);

            batch.delete(doc(db, 'groups', groupId));

            const expensesQuery = query(
              collection(db, 'expenses'),
              where('groupId', '==', groupId),
            );

            const expensesSnapshot = await getDocs(expensesQuery);
            expensesSnapshot.forEach(expenseDoc => {
              batch.delete(expenseDoc.ref);
            });

            await batch.commit();

            dispatch(removeGroup(groupId));
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete group: ' + error.message);
          }
        },
      },
    ]);
  };

  const handleOpenChat = (groupId: string, groupName: string) => {
    navigation.navigate('GroupChatScreen', {groupId, groupName});
  };

  const renderLeftActions = (groupId: string, groupName: string) => {
    return (
      <View style={styles.leftActionContainer}>
        <RectButton
          style={[styles.leftAction, styles.chatAction]}
          onPress={() => handleOpenChat(groupId, groupName)}>
          <Text style={styles.actionText}>Chat</Text>
        </RectButton>
      </View>
    );
  };

  const renderRightActions = (groupId: string) => {
    return (
      <View style={styles.rightActionContainer}>
        <RectButton
          style={[styles.rightAction, styles.deleteAction]}
          onPress={() => handleDeleteGroup(groupId)}>
          <Text style={styles.actionText}>Delete</Text>
        </RectButton>
      </View>
    );
  };

  const getGroupImageSource = (groupImage: string | null | undefined) => {
    if (!groupImage) {
      return defaultGroupImage;
    }

    if (!isNaN(Number(groupImage))) {
      return defaultGroupImage;
    }

    try {
      if (groupImage.startsWith('http') || groupImage.startsWith('file://')) {
        return {uri: groupImage};
      }
      return defaultGroupImage;
    } catch (error) {
      console.error('Error processing group image:', error);
      return defaultGroupImage;
    }
  };

  const renderGroupItem = ({item}: {item: group}) => (
    <GestureHandlerRootView>
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        renderLeftActions={() => renderLeftActions(item.id, item.groupName)}
        overshootRight={false}
        overshootLeft={false}>
        <TouchableOpacity
          style={styles.groupItem}
          onPress={() => {
            navigation.navigate('GroupDetailsScreen', {groupId: item.id});
          }}>
          <Image
            source={getGroupImageSource(item.groupImage)}
            style={styles.groupImage}
            defaultSource={defaultGroupImage}
          />
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.groupName}</Text>
            <Text style={styles.memberCount}>
              <Ionicons name="people" size={14} color="#666" />{' '}
              {item.membersCount} members
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </GestureHandlerRootView>
  );

  if (authState.loading) {
    return (
      <View style={styles.authContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.statusText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.errorText}>Please log in to view your groups</Text>
        <TouchableOpacity
          style={styles.buttonStyle}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Groups</Text>
        </View>
        {loader || loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CBB9B" />
            <Text style={styles.statusText}>Loading groups...</Text>
          </View>
        ) : null}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.buttonStyle} onPress={handleRetry}>
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !loader && (!groups || groups.length === 0) && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.statusText}>
              No groups found. Create your first group!
            </Text>
            <TouchableOpacity
              style={styles.buttonStyle}
              onPress={handleCreateGroupPress}>
              <Text style={styles.buttonText}>Create New Group</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !loader && groups && groups.length > 0 && (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={item => item.id}
            style={styles.groupsList}
            contentContainerStyle={styles.groupsListContent}
          />
        )}

        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleCreateGroupPress}>
          <Ionicons name="add-circle-outline" size={30} color="white" />
          <Text style={styles.Create}>Create Group</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f7f7f7',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  groupsList: {
    flex: 1,
  },
  groupsListContent: {
    paddingVertical: 5,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 15,
    borderWidth: 0.5,
    borderColor: 'grey',
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4CBB9B',
    marginBottom: 5,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 10,
  },
  statusText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 10,
    color: 'red',
  },
  errorContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionContainer: {
    width: 80,
    flexDirection: 'row',
  },
  leftActionContainer: {
    width: 80,
    flexDirection: 'row',
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  leftAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  deleteAction: {
    backgroundColor: '#3c7d75',
  },
  chatAction: {
    backgroundColor: '#4CBB9B',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 10,
  },
  fabButton: {
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4CBB9B',
    width: 140,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  Create: {
    marginLeft: 4,
    color: 'white',
  },
  buttonStyle: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GroupScreen;
