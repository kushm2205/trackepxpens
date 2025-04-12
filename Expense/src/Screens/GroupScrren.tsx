import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchGroups, deleteGroup} from '../Redux/slice/GroupSlice';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {RootState, AppDispatch} from '../Redux/store';
import {auth, db} from '../services/firebase'; // Import db
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  Swipeable,
  RectButton,
} from 'react-native-gesture-handler';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore'; // Import necessary Firestore functions

const defaultGroupImage = require('../assets/download.jpeg');
type GroupScreenProp = StackNavigationProp<RootStackParamList, 'GroupScreen'>;

const GroupScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {groups, loading, error} = useSelector(
    (state: RootState) => state.group,
  );
  console.log('Groupssss', groups);
  const authState = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<GroupScreenProp>();
  const [authChecked, setAuthChecked] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (authState.isAuthenticated && authState.userId && !loading && !error) {
      dispatch(fetchGroups(authState.userId));
    }
  }, [authState.isAuthenticated, authState.userId, dispatch, retryAttempt]);

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

            if (authState.userId) {
              dispatch(fetchGroups(authState.userId));
            }
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete group: ' + error.message);
          }
        },
      },
    ]);
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

  const renderGroupItem = ({item}: {item: any}) => (
    <GestureHandlerRootView>
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}>
        <TouchableOpacity
          style={styles.groupItem}
          onPress={() => {
            navigation.navigate('GroupDetailsScreen', {groupId: item.id});
          }}>
          <Image
            source={
              item.groupImageUrl ? {uri: item.groupImageUrl} : defaultGroupImage
            }
            style={styles.groupImage}
          />
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.groupName}</Text>
            <Text
              style={
                styles.memberCount
              }>{`Members: ${item.membersCount}`}</Text>
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
        <Button
          title="Go to Login"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container}>
        <Text style={styles.header}>Groups</Text>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.statusText}>Loading groups...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Retry" onPress={handleRetry} />
          </View>
        )}
        {!loading && (!groups || groups.length === 0) && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.statusText}>
              No groups found. Create your first group!
            </Text>
            <Button title="Create New Group" onPress={handleCreateGroupPress} />
          </View>
        )}
        {!loading && groups && groups.length > 0 && (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={item => item.id}
            style={styles.groupsList}
          />
        )}
        <View style={styles.buttonContainer}>
          <Button title="Create New Group" onPress={handleCreateGroupPress} />
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  groupsList: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
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
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  deleteAction: {
    backgroundColor: 'red',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 10,
  },
});

export default GroupScreen;
