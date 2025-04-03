import storage from '@react-native-firebase/storage';

const DEFAULT_AVATAR =
  'https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/default-avatar.png?alt=media';

export const uploadImage = async (imageUri: string) => {
  if (!imageUri) return DEFAULT_AVATAR;

  try {
    // Extract the file extension (png or jpg)
    const extension = imageUri.split('.').pop()?.toLowerCase();
    const filename = `groups/${Date.now()}.${extension}`;

    // Reference Firebase Storage
    const ref = storage().ref(filename);

    // Upload the file
    await ref.putFile(imageUri);

    // Get the file URL after upload
    const downloadURL = await ref.getDownloadURL();
    console.log('✅ Image uploaded successfully:', downloadURL);

    return downloadURL; // Return image URL
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return DEFAULT_AVATAR;
  }
};
