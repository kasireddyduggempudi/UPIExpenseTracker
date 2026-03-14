import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AppState,
  AppStateStatus,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CategorySelector} from '../components/CategorySelector';
import {AmountInput} from '../components/AmountInput';
import {CATEGORIES, UPI_APPS, UpiAppOption} from '../utils/constants';
import {RootStackParamList} from '../navigation/types';
import {createTransaction} from '../services/transactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const sanitizeAmount = (value: string): string => value.replace(/[^\d.]/g, '');

export const PaymentScreen = ({navigation}: Props) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedUpiApp, setSelectedUpiApp] = useState<UpiAppOption | null>(
    UPI_APPS[0] ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);

  const currentAppStateRef = useRef<AppStateStatus>(AppState.currentState);
  const promptOpenRef = useRef(false);
  const launchedUpiFlowRef = useRef(false);
  const pendingTransactionRef = useRef<{
    amount: number;
    category: string;
    selectedUpiApp: UpiAppOption;
  } | null>(null);

  const amountValue = useMemo(() => Number(amount), [amount]);

  const saveTransaction = async (status: 'SUCCESS' | 'FAILED') => {
    const pendingTransaction = pendingTransactionRef.current;
    if (!pendingTransaction) {
      return;
    }

    await createTransaction({
      amount: pendingTransaction.amount,
      category: pendingTransaction.category,
      upiId: pendingTransaction.selectedUpiApp.label,
      status,
    });
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const previousState = currentAppStateRef.current;
      currentAppStateRef.current = nextState;

      if (
        !waitingForConfirmation ||
        !launchedUpiFlowRef.current ||
        promptOpenRef.current
      ) {
        return;
      }

      const returnedToApp =
        (previousState === 'inactive' || previousState === 'background') &&
        nextState === 'active';

      if (!returnedToApp) {
        return;
      }

      promptOpenRef.current = true;
      Alert.alert('Payment Confirmation', 'Did payment succeed?', [
        {
          text: 'No',
          style: 'destructive',
          onPress: () => {
            saveTransaction('FAILED')
              .then(() => {
                Alert.alert('Saved', 'Marked as failed transaction.');
              })
              .finally(() => {
                pendingTransactionRef.current = null;
                setWaitingForConfirmation(false);
                launchedUpiFlowRef.current = false;
                promptOpenRef.current = false;
              });
          },
        },
        {
          text: 'Yes',
          onPress: () => {
            saveTransaction('SUCCESS')
              .then(() => {
                Alert.alert('Payment Success', 'Transaction saved locally.');
                navigation.navigate('Dashboard');
              })
              .finally(() => {
                pendingTransactionRef.current = null;
                setWaitingForConfirmation(false);
                launchedUpiFlowRef.current = false;
                promptOpenRef.current = false;
              });
          },
        },
      ]);
    });

    return () => {
      subscription.remove();
    };
  }, [navigation, waitingForConfirmation]);

  const onPay = async () => {
    if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter an amount greater than zero.',
      );
      return;
    }

    if (!selectedUpiApp) {
      Alert.alert('UPI App Required', 'Please select a UPI app first.');
      return;
    }

    setLoading(true);

    try {
      pendingTransactionRef.current = {
        amount: amountValue,
        category,
        selectedUpiApp,
      };

      await Linking.openURL(selectedUpiApp.scheme);
      launchedUpiFlowRef.current = true;
      setWaitingForConfirmation(true);
    } catch {
      pendingTransactionRef.current = null;
      launchedUpiFlowRef.current = false;
      Alert.alert(
        'Open UPI App Failed',
        `Could not open ${selectedUpiApp.label}. Make sure it is installed.`,
      );
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
          Enter amount, choose category, open a UPI app, and confirm payment.
        </Text>

        <AmountInput
          value={amount}
          onChangeText={value => setAmount(sanitizeAmount(value))}
        />

        <CategorySelector
          categories={CATEGORIES}
          selectedCategory={category}
          onChange={setCategory}
        />

        <Text style={styles.label}>UPI App</Text>
        <View style={styles.appsWrap}>
          {UPI_APPS.map(app => {
            const isSelected = selectedUpiApp?.id === app.id;

            return (
              <TouchableOpacity
                key={app.id}
                style={[styles.appChip, isSelected && styles.appChipSelected]}
                onPress={() => setSelectedUpiApp(app)}>
                <Text
                  style={[
                    styles.appChipText,
                    isSelected && styles.appChipTextSelected,
                  ]}>
                  {app.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabled]}
          onPress={onPay}
          disabled={loading}>
          <Text style={styles.actionButtonText}>
            {loading ? 'Opening App...' : 'Pay'}
          </Text>
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
  appsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  appChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  appChipSelected: {
    backgroundColor: '#115e59',
    borderColor: '#115e59',
  },
  appChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  appChipTextSelected: {
    color: '#ffffff',
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
  disabled: {
    opacity: 0.6,
  },
});
