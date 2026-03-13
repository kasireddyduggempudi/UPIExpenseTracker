import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CategorySelector} from '../components/CategorySelector';
import {AmountInput} from '../components/AmountInput';
import {CATEGORIES} from '../utils/constants';
import {RootStackParamList} from '../navigation/types';
import {startUpiPayment} from '../services/upiService';
import {createTransaction} from '../services/transactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const sanitizeAmount = (value: string): string => value.replace(/[^\d.]/g, '');

export const PaymentScreen = ({navigation, route}: Props) => {
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);

  const scannedData = route.params?.scannedData;

  useEffect(() => {
    if (!scannedData) {
      return;
    }

    setUpiId(scannedData.upiId);

    if (typeof scannedData.amount === 'number' && scannedData.amount > 0) {
      setAmount(scannedData.amount.toFixed(2));
    }

    navigation.setParams({scannedData: undefined});
  }, [navigation, scannedData]);

  const amountValue = useMemo(() => Number(amount), [amount]);

  const onPay = async () => {
    if (!upiId.trim()) {
      Alert.alert('Missing UPI ID', 'Please enter a valid UPI ID.');
      return;
    }

    if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter an amount greater than zero.',
      );
      return;
    }

    setLoading(true);

    try {
      const result = await startUpiPayment(upiId.trim(), amountValue);

      if (result.status === 'SUCCESS') {
        await createTransaction({
          amount: amountValue,
          category,
          upiId: upiId.trim(),
          status: result.status,
          txnId: result.txnId,
        });

        Alert.alert('Payment Success', 'Transaction saved locally.');
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Payment Not Completed', `Status: ${result.status}`);
      }
    } catch {
      Alert.alert('Payment Error', 'Could not launch UPI payment flow.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>UPI Payment Wrapper</Text>
        <Text style={styles.subtitle}>
          Track spending by category before paying.
        </Text>

        <Text style={styles.label}>UPI ID</Text>
        <TextInput
          style={styles.input}
          placeholder="name@bank"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          value={upiId}
          onChangeText={setUpiId}
        />

        <AmountInput
          value={amount}
          onChangeText={value => setAmount(sanitizeAmount(value))}
        />

        <CategorySelector
          categories={CATEGORIES}
          selectedCategory={category}
          onChange={setCategory}
        />

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabled]}
          onPress={onPay}
          disabled={loading}>
          <Text style={styles.actionButtonText}>
            {loading ? 'Processing...' : 'Pay'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Scanner')}>
          <Text style={styles.secondaryButtonText}>Scan QR</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderColor: '#d9e2ec',
    borderWidth: 1,
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  label: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderColor: '#d6dee8',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#115e59',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#115e59',
    backgroundColor: '#eef8f7',
  },
  secondaryButtonText: {
    color: '#115e59',
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
