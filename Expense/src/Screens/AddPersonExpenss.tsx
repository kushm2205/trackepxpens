import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../redux/store';
import {addPersonalExpense} from '../Redux/slice/personalexpenssslice';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';

const CATEGORIES = [
  {name: 'Food', icon: 'fast-food-outline', color: '#FF6B6B'},
  {name: 'Transport', icon: 'car-outline', color: '#4ECDC4'},
  {name: 'Shopping', icon: 'cart-outline', color: '#FFD166'},
  {name: 'Bills', icon: 'cash-outline', color: '#6A0572'},
  {name: 'Entertainment', icon: 'film-outline', color: '#F72585'},
  {name: 'Health', icon: 'medical-outline', color: '#3A86FF'},
  {name: 'Other', icon: 'wallet-outline', color: '#7209B7'},
];

const AddPersonalExpenseScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const {userId} = useSelector((state: RootState) => state.auth);
  const {loading} = useSelector((state: RootState) => state.personalExpenses);

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const resultAction = await dispatch(
        addPersonalExpense({
          userId,
          amount: parseFloat(amount),
          description,
          category,
          date,
        }),
      );

      if (addPersonalExpense.fulfilled.match(resultAction)) {
        Platform.OS === 'ios'
          ? Alert.alert('Success', 'Personal expense added successfully')
          : ToastAndroid.show(
              'successfully added personal expenss',
              ToastAndroid.SHORT,
            );
        navigation.goBack();
      } else {
        const error = resultAction.payload;
        Alert.alert(
          'Error',
          error ? error.toString() : 'Failed to add expense',
        );
      }
    } catch (error) {
      let errorMessage = 'Failed to add expense. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(currentDate);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Personal Expense</Text>
          <View style={{width: 24}} />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What did you spend on?"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryButton,
                    category === cat.name && {
                      borderColor: cat.color,
                      backgroundColor: `${cat.color}20`,
                    },
                  ]}
                  onPress={() => setCategory(cat.name)}>
                  <View
                    style={[styles.categoryIcon, {backgroundColor: cat.color}]}>
                    <Ionicons name={cat.icon} size={20} color="white" />
                  </View>
                  <Text style={styles.categoryText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Save Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#29846A',
  },
  formContainer: {
    padding: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4BBC9B',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'grey',
    minWidth: 100,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4BBC9B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    width: '30%',
    alignItems: 'center',
    marginRight: '3%',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'grey',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#4bbc9b',
    fontWeight: '600',
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'gry',
  },
  dateText: {
    fontSize: 16,
    color: 'grey',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#4BBC9B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPersonalExpenseScreen;
