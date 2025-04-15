import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

interface MockPaymentGatewayProps {
  onPaymentSuccess: () => void;
  onPaymentFailure: () => void;
}

const MockPaymentGateway: React.FC<MockPaymentGatewayProps> = ({
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  const handlePayment = () => {
    if (!cardNumber || !expiry || !cvv || !name) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Simulate payment processing
    Alert.alert(
      'Confirm Payment',
      'This is a mock payment gateway for testing. No real money will be charged.',
      [
        {
          text: 'Cancel',
          onPress: onPaymentFailure,
          style: 'cancel',
        },
        {
          text: 'Pay ₹299',
          onPress: () => {
            // Simulate API call
            setTimeout(() => {
              onPaymentSuccess();
            }, 5000);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Premium Subscription</Text>
      <Text style={styles.subtitle}>
        ₹299/month - Unlimited Expense Tracking
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Card Number"
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="numeric"
        maxLength={16}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="MM/YY"
          value={expiry}
          onChangeText={setExpiry}
          maxLength={5}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="CVV"
          value={cvv}
          onChangeText={setCvv}
          keyboardType="numeric"
          maxLength={3}
          secureTextEntry
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Cardholder Name"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
        <Text style={styles.payButtonText}>Pay ₹299</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: This is a mock payment gateway for testing purposes only. No real
        transactions will be processed.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    marginTop: 30,
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MockPaymentGateway;
