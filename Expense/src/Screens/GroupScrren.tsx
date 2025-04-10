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
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchGroups} from '../Redux/slice/GroupSlice';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {RootState, AppDispatch} from '../Redux/store';
import {auth} from '../services/firebase';

const defaultGroupImage = require('../assets/download.jpeg');
type GroupScreenProp = StackNavigationProp<RootStackParamList, 'GroupScreen'>;

const GroupScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {groups, loading, error} = useSelector(
    (state: RootState) => state.Group,
  );
  const authState = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<GroupScreenProp>();
  const [authChecked, setAuthChecked] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!isMounted) return;

      setAuthChecked(true);

      if (user) {
        try {
          await user.getIdToken(true);
          setTimeout(() => {
            if (isMounted) {
              dispatch(fetchGroups());
            }
          }, 5000);
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [dispatch, retryAttempt]);

  const handleCreateGroupPress = () => {
    navigation.navigate('CreateGroup');
  };

  const handleRetry = () => {
    setRetryAttempt(prev => prev + 1);
  };

  const renderGroupItem = ({item}: {item: any}) => (
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
          style={styles.memberCount}>{`Members: ${item.membersCount}`}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!authChecked || authState.loading) {
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

      {!loading && groups && groups.length === 0 && !error && (
        <Text style={styles.statusText}>
          No groups found. Create your first group!
        </Text>
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
});

export default GroupScreen;
