import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import {createGroup} from '../services/firestore';
import {getDocs, collection} from 'firebase/firestore';
import {db} from '../services/firebase';

const defaultProfileImage = require('../assets/download.png');
const defaultGroupImage = require('../assets/download.png'); // Add default group image

const CreateGroup = ({navigation}: any) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [groupImage, setGroupImage] = useState(null); // Add group image state

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          phone: data.phone,
          profilePicture: data.profilePicture,
        };
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateGroup = async () => {
    try {
      const groupId = await createGroup(
        groupName,
        'adminUserId',
        selectedMembers,
        groupImage, // Pass group image to createGroup function
      );
      navigation.navigate('GroupScreen');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  // Function to handle group image selection (replace with your image selection logic)
  const handleGroupImageSelection = () => {
    // Example: setGroupImage('path/to/selected/image.jpg');
    setGroupImage(''); // Replace with your logic
  };

  return (
    <View>
      <TouchableOpacity onPress={handleGroupImageSelection}>
        <Image
          source={groupImage ? {uri: groupImage} : defaultGroupImage}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            alignSelf: 'center',
          }}
        />
      </TouchableOpacity>
      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <Text>Select Members:</Text>
      <FlatList
        data={users}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => toggleMemberSelection(item.id)}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={
                  item.profilePicture
                    ? {uri: item.profilePicture}
                    : defaultProfileImage
                }
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 10,
                }}
              />
              <Text
                style={{
                  color: selectedMembers.includes(item.id) ? 'blue' : 'black',
                }}>
                {item.name} - {item.phone}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
      <Button title="Create Group" onPress={handleCreateGroup} />
    </View>
  );
};

export default CreateGroup;
