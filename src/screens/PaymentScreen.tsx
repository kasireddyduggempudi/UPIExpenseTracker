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
  TextInput,
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
type PaymentMode = 'MANUAL' | 'INTENT';

const sanitizeAmount = (value: string): string => value.replace(/[^\d.]/g, '');
const GENERIC_UPI_URL = 'upi://pay?cu=INR';
const INTENT_PAYEE_NAME = 'DecorPay';

const buildUpiIntentUrl = (payeeVpa: string, amountValue: number): string => {
  const transactionRef = `DCP-${Date.now()}`;
  const params = new URLSearchParams({
    pa: payeeVpa,
    pn: INTENT_PAYEE_NAME,
    tr: transactionRef,
    tn: 'DecorPay Payment',
    cu: 'INR',
  });

  if (amountValue > 0) {
    // Intentionally omitted from the URL for better compatibility in some UPI apps.
    // The user enters amount inside the UPI app, while we still track requested amount.
  }

  return `upi://pay?${params.toString()}`;
};

export const PaymentScreen = ({navigation}: Props) => {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('MANUAL');
  const [amount, setAmount] = useState('');
  const [intentUpiId, setIntentUpiId] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedUpiApp, setSelectedUpiApp] = useState<UpiAppOption | null>(
    UPI_APPS[0] ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);

  const currentAppStateRef = useRef<AppStateStatus>(AppState.currentState);
  const promptOpenRef = useRef(false);
  const launchedUpiFlowRef = useRef(false);
  const didGoBackgroundRef = useRef(false);
  const pendingTransactionRef = useRef<{
    amount: number;
    category: string;
    selectedUpiApp: UpiAppOption;
    mode: PaymentMode;
    intentUpiId?: string;
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
      upiId:
        pendingTransaction.mode === 'INTENT'
          ? pendingTransaction.intentUpiId ?? 'UPI Intent'
          : pendingTransaction.selectedUpiApp.label,
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

      if (
        previousState === 'active' &&
        (nextState === 'inactive' || nextState === 'background')
      ) {
        didGoBackgroundRef.current = true;
        return;
      }

      const returnedToApp =
        (previousState === 'inactive' || previousState === 'background') &&
        nextState === 'active' &&
        didGoBackgroundRef.current;

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
                didGoBackgroundRef.current = false;
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
                didGoBackgroundRef.current = false;
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

  const openManualFlow = async (
    amountValueToPay: number,
    selectedApp: UpiAppOption,
  ) => {
    pendingTransactionRef.current = {
      amount: amountValueToPay,
      category,
      selectedUpiApp: selectedApp,
      mode: 'MANUAL',
    };

    didGoBackgroundRef.current = false;

    let opened = false;
    const canOpenSelected = await Linking.canOpenURL(selectedApp.scheme);
    if (canOpenSelected) {
      await Linking.openURL(selectedApp.scheme);
      opened = true;
    }

    if (!opened) {
      const canOpenGenericUpi = await Linking.canOpenURL(GENERIC_UPI_URL);
      if (canOpenGenericUpi) {
        await Linking.openURL(GENERIC_UPI_URL);
        opened = true;
      }
    }

    if (!opened) {
      pendingTransactionRef.current = null;
      launchedUpiFlowRef.current = false;
      Alert.alert(
        'UPI App Not Available',
        'Could not open the selected UPI app. Please try another app.',
      );
      return;
    }

    launchedUpiFlowRef.current = true;
    setWaitingForConfirmation(true);
  };

  const openIntentFlow = async (amountValueToPay: number, payeeVpa: string) => {
    const intentUrl = buildUpiIntentUrl(payeeVpa, amountValueToPay);
    const canOpenIntent = await Linking.canOpenURL(intentUrl);

    if (!canOpenIntent) {
      Alert.alert(
        'UPI Intent Not Supported',
        'Could not open UPI payment intent on this device.',
      );
      return;
    }

    pendingTransactionRef.current = {
      amount: amountValueToPay,
      category,
      selectedUpiApp: selectedUpiApp ?? UPI_APPS[0],
      mode: 'INTENT',
      intentUpiId: payeeVpa,
    };

    didGoBackgroundRef.current = false;
    await Linking.openURL(intentUrl);
    launchedUpiFlowRef.current = true;
    setWaitingForConfirmation(true);
  };

  const onPay = async () => {
    if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter an amount greater than zero.',
      );
      return;
    }

    if (paymentMode === 'MANUAL' && !selectedUpiApp) {
      Alert.alert('UPI App Required', 'Please select a UPI app first.');
      return;
    }

    if (paymentMode === 'INTENT') {
      const vpa = intentUpiId.trim();
      if (!vpa || !vpa.includes('@')) {
        Alert.alert(
          'UPI ID Required',
          'Please enter a valid UPI ID for intent mode.',
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (paymentMode === 'MANUAL') {
        await openManualFlow(amountValue, selectedUpiApp as UpiAppOption);
      } else {
        await openIntentFlow(amountValue, intentUpiId.trim());
      }
    } catch {
      pendingTransactionRef.current = null;
      launchedUpiFlowRef.current = false;
      didGoBackgroundRef.current = false;
      Alert.alert(
        'Open UPI App Failed',
        paymentMode === 'MANUAL'
          ? `Could not open ${
              (selectedUpiApp as UpiAppOption).label
            }. Try Google Pay or another installed UPI app.`
          : 'Could not open direct UPI intent. Try manual mode.',
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

        <Text style={styles.label}>Payment Mode</Text>
        <View style={styles.modeWrap}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              paymentMode === 'MANUAL' && styles.modeButtonSelected,
            ]}
            onPress={() => setPaymentMode('MANUAL')}>
            <Text
              style={[
                styles.modeButtonText,
                paymentMode === 'MANUAL' && styles.modeButtonTextSelected,
              ]}>
              Manual App Flow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              paymentMode === 'INTENT' && styles.modeButtonSelected,
            ]}
            onPress={() => setPaymentMode('INTENT')}>
            <Text
              style={[
                styles.modeButtonText,
                paymentMode === 'INTENT' && styles.modeButtonTextSelected,
              ]}>
              Direct Intent
            </Text>
          </TouchableOpacity>
        </View>

        <AmountInput
          value={amount}
          onChangeText={value => setAmount(sanitizeAmount(value))}
        />

        <CategorySelector
          categories={CATEGORIES}
          selectedCategory={category}
          onChange={setCategory}
        />

        {paymentMode === 'MANUAL' ? (
          <>
            <Text style={styles.label}>UPI App</Text>
            <View style={styles.appsWrap}>
              {UPI_APPS.map(app => {
                const isSelected = selectedUpiApp?.id === app.id;

                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[
                      styles.appChip,
                      isSelected && styles.appChipSelected,
                    ]}
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
          </>
        ) : (
          <View style={styles.intentInfoBox}>
            <Text style={styles.intentInfoText}>
              Direct intent uses standard UPI URL and does not pass amount in
              the link.
            </Text>
            <Text style={styles.label}>UPI ID</Text>
            <TextInput
              style={styles.intentInput}
              placeholder="merchant@upi"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              value={intentUpiId}
              onChangeText={setIntentUpiId}
            />
            <Text style={styles.intentInfoMeta}>
              Payee: {INTENT_PAYEE_NAME}
            </Text>
            <Text style={styles.intentInfoMeta}>
              VPA: {intentUpiId.trim() || '-'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabled]}
          onPress={onPay}
          disabled={loading}>
          <Text style={styles.actionButtonText}>
            {loading
              ? 'Opening App...'
              : paymentMode === 'MANUAL'
              ? 'Pay (Manual)'
              : 'Pay (Intent)'}
          </Text>
        </TouchableOpacity>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.secondaryButtonText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('History')}>
            <Text style={styles.secondaryButtonText}>History</Text>
          </TouchableOpacity>
        </View>
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
  modeWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modeButtonSelected: {
    backgroundColor: '#115e59',
    borderColor: '#115e59',
  },
  modeButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  modeButtonTextSelected: {
    color: '#ffffff',
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
  intentInfoBox: {
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 8,
  },
  intentInfoText: {
    color: '#334155',
    fontSize: 12,
  },
  intentInfoMeta: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  intentInput: {
    borderRadius: 10,
    borderColor: '#d6dee8',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    height: 44,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 6,
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
  navRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#115e59',
    backgroundColor: '#eef8f7',
  },
  secondaryButtonText: {
    color: '#115e59',
    fontSize: 14,
    fontWeight: '700',
  },
});
