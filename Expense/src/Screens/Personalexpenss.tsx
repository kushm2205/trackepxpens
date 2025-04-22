import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../redux/store';
import {
  fetchPersonalExpenses,
  PersonalExpense,
} from '../Redux/slice/personalexpenssslice';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

type RootStackParamList = {
  AddPersonalExpense: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PersonalExpensesScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  const {userId} = useSelector((state: RootState) => state.auth);
  const {expenses, loading} = useSelector(
    (state: RootState) => state.personalExpenses,
  );

  useEffect(() => {
    if (userId) {
      dispatch(fetchPersonalExpenses(userId));
    }
  }, [dispatch, userId]);

  const handleAddExpense = () => {
    navigation.navigate('AddPersonalExpense');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) {
      return 'N/A';
    }

    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      } else if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4BBC9B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal Expenses</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No personal expenses yet</Text>
          <Text style={styles.emptySubText}>
            Track your individual spending by adding expenses
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={handleAddExpense}>
            <Text style={styles.addFirstButtonText}>Add First Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={item => item.id || Math.random().toString()}
          renderItem={({item}: {item: PersonalExpense}) => (
            <View style={styles.expenseItem}>
              <View style={styles.expenseCategory}>
                <View
                  style={[
                    styles.categoryIcon,
                    {backgroundColor: getCategoryColor(item.category)},
                  ]}>
                  <Ionicons
                    name={getCategoryIcon(item.category)}
                    size={20}
                    color="white"
                  />
                </View>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseDescription}>
                  {item.description}
                </Text>
                <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
              </View>
              <Text style={styles.expenseAmount}>
                ₹{parseFloat(item.amount.toString()).toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

// Helper functions for category icons and colors
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'food':
      return 'fast-food-outline';
    case 'transport':
      return 'car-outline';
    case 'shopping':
      return 'cart-outline';
    case 'bills':
      return 'cash-outline';
    case 'entertainment':
      return 'film-outline';
    case 'health':
      return 'medical-outline';
    default:
      return 'wallet-outline';
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'food':
      return '#FF6B6B';
    case 'transport':
      return '#4ECDC4';
    case 'shopping':
      return '#FFD166';
    case 'bills':
      return '#6A0572';
    case 'entertainment':
      return '#F72585';
    case 'health':
      return '#3A86FF';
    default:
      return '#7209B7';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    margin: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4BBC9B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#4BBC9B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  expenseItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseCategory: {
    alignItems: 'center',
    width: 70,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: 'grey',
    marginTop: 4,
  },
  expenseDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3bb0de',
  },
  expenseDate: {
    fontSize: 12,
    color: 'grey',
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4BBC9B',
  },
});

export default PersonalExpensesScreen;
