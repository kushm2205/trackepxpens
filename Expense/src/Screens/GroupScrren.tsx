import React, {useEffect} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchGroups} from '../Redux/slice/GroupSlice';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {RootState, AppDispatch} from '../Redux/store';

const defaultGroupImage = require('../assets/download.jpeg');
type GroupScreenProp = StackNavigationProp<RootStackParamList, 'GroupScreen'>;

const GroupScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {groups, loading, error} = useSelector(
    (state: RootState) => state.Group,
  );
  const navigation = useNavigation<GroupScreenProp>();

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  const handleCreateGroupPress = () => {
    navigation.navigate('CreateGroup');
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Groups</Text>

      {loading && <Text style={styles.statusText}>Loading groups...</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && groups.length === 0 && (
        <Text style={styles.statusText}>
          No groups found. Create your first group!
        </Text>
      )}

      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.id}
        style={styles.groupsList}
      />

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
    marginVertical: 20,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 20,
    color: 'red',
  },
});

export default GroupScreen;
