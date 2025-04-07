import React, {useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../Redux/store';
import {fetchGroupDetails, fetchUserDetails} from '../Redux/slice/GroupSlice';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

type RootStackParamList = {
  GroupDetails: {groupId: string};
  AddExpense: {groupId: string};
};

type GroupDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'GroupDetails'
>;
type GroupDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GroupDetails'
>;

const GroupDetailsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<GroupDetailsScreenNavigationProp>();
  const {selectedGroup, loading, error, memberNames} = useSelector(
    (state: RootState) => state.Group,
  );
  const route = useRoute<GroupDetailsScreenRouteProp>();
  const {groupId} = route.params;

  useEffect(() => {
    dispatch(fetchGroupDetails(groupId));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.members) {
      selectedGroup.members.forEach((memberId: string) => {
        if (!memberNames[memberId]) {
          dispatch(fetchUserDetails(memberId));
        }
      });
    }
  }, [dispatch, selectedGroup, memberNames]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error || !selectedGroup) {
    return <Text>Error: {error || 'Group not found'}</Text>;
  }

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', {groupId: groupId});
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container}>
        {selectedGroup.groupImageUrl && (
          <Image
            source={{uri: selectedGroup.groupImageUrl}}
            style={styles.groupImage}
          />
        )}
        <Text style={styles.groupName}>{selectedGroup.groupName}</Text>
        <Text style={styles.membersTitle}>Members:</Text>
        {selectedGroup.members.map((memberId: React.Key | null | undefined) => (
          <Text key={memberId}>{memberNames[memberId] || memberId}</Text>
        ))}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button}>
            <Text>Settled Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text>Balance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text>Totals</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.addExpenseButton}
        onPress={handleAddExpense}>
        <Text style={styles.addExpenseButtonText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  groupImage: {
    width: '100%',
    height: '20%',
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  membersTitle: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  addExpenseButton: {
    backgroundColor: '#007bff',
    padding: 15,
    alignItems: 'center',
  },
  addExpenseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GroupDetailsScreen;
