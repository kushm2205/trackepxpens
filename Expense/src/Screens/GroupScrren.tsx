import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import {getDocs, collection, getDoc, doc} from 'firebase/firestore';
import {db} from '../services/firebase';
import {useNavigation} from '@react-navigation/native';

const defaultGroupImage = require('../assets/download.jpeg'); // Replace with your default group image path

const GroupScreen = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const navigation = useNavigation();

  // Fetch groups from Firestore
  const fetchGroups = async () => {
    try {
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const groupsList = await Promise.all(
        groupsSnapshot.docs.map(async doc => {
          const groupData = doc.data();
          console.log(groupData);
          const membersCount = groupData.members ? groupData.members.length : 0; // Get the number of members
          let groupImageUrl = defaultGroupImage; // Default image

          if (groupData.groupImage) {
            groupImageUrl = {uri: groupData.groupImage}; // Use group image if available
          }

          return {
            id: doc.id,
            ...groupData,
            membersCount,
            groupImageUrl,
          };
        }),
      );
      setGroups(groupsList);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <View>
      <Text>Groups</Text>
      <FlatList
        data={groups}
        renderItem={({item}) => (
          <TouchableOpacity
            style={{flexDirection: 'row', alignItems: 'center', padding: 10}}>
            <Image
              source={item.groupImageUrl}
              style={{width: 50, height: 50, borderRadius: 25, marginRight: 10}}
            />
            <View>
              <Text>{item.groupName}</Text>
              <Text>{`Members: ${item.membersCount}`}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
      <Button
        title="Create New Group"
        onPress={() => navigation.navigate('CreateGroup')}
      />
    </View>
  );
};

export default GroupScreen;
