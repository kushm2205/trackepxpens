import React from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';

const TransactionHistory = ({groupId}) => {
  const transactions = useSelector(state =>
    state.group.transactions
      .filter(t => t.groupId === groupId)
      .sort((a, b) => b.createdAt - a.createdAt),
  );

  return (
    <FlatList
      data={transactions}
      renderItem={({item}) => (
        <View style={styles.transactionItem}>
          <Text>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text>{item.description}</Text>
          <Text>₹{item.amount.toFixed(2)}</Text>
          <Text>Paid by: {item.paidByName}</Text>
          <Text>Split between: {item.splitBetweenNames.join(', ')}</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  transactionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default TransactionHistory;
