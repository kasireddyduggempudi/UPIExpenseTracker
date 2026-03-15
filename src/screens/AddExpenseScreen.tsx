import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {CATEGORIES, OTHER_CATEGORY_ID} from '../utils/constants';
import {
  addExpense,
  evaluateBudgetThreshold,
  updateExpense,
} from '../services/transactionService';
import {formatDateDisplay, shiftDate, todayString} from '../utils/dateUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const PRIMARY = '#2D6A4F';
const BG = '#F8FAF9';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1B1B2F';
const TEXT_SEC = '#6B7280';
const BORDER = '#E5E7EB';

export function AddExpenseScreen({navigation, route}: Props) {
  const expense = route.params?.expense;
  const isEditing = Boolean(expense);

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [customCategory, setCustomCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayString());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({title: isEditing ? 'Edit Expense' : 'Add Expense'});
  }, [isEditing, navigation]);

  useEffect(() => {
    if (!expense) {
      return;
    }

    setAmount(String(expense.amount));
    setSelectedCategory(expense.category);
    setCustomCategory(expense.customCategory ?? '');
    setNote(expense.note ?? '');
    setDate(expense.date);
  }, [expense]);

  const successActions = useMemo(
    () => [
      {text: 'OK', onPress: () => navigation.goBack()},
      {text: 'Dashboard', onPress: () => navigation.navigate('Dashboard')},
    ],
    [navigation],
  );

  const shiftDay = useCallback(
    (delta: number) => setDate(prev => shiftDate(prev, delta)),
    [],
  );

  const handleSave = useCallback(async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than 0.');
      return;
    }

    if (selectedCategory === OTHER_CATEGORY_ID && !customCategory.trim()) {
      Alert.alert('Category Required', 'Please describe the Other category.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: parsedAmount,
        category: selectedCategory,
        customCategory:
          selectedCategory === OTHER_CATEGORY_ID
            ? customCategory.trim()
            : undefined,
        note: note.trim() || undefined,
        date,
      };

      if (expense) {
        await updateExpense(expense.id, payload);
      } else {
        await addExpense(payload);
      }

      const budgetEvent = await evaluateBudgetThreshold(date);

      if (!expense) {
        setAmount('');
        setCustomCategory('');
        setNote('');
        setDate(todayString());
      }

      if (budgetEvent?.level === 100) {
        Alert.alert(
          'Budget Reached',
          `You have reached 100% of your monthly budget.\n\nSpent: ${budgetEvent.total.toFixed(
            2,
          )}\nLimit: ${budgetEvent.limit.toFixed(2)}`,
          successActions,
        );
      } else if (budgetEvent?.level === 80) {
        Alert.alert(
          'Budget Alert',
          `You have used 80% of your monthly budget.\n\nSpent: ${budgetEvent.total.toFixed(
            2,
          )}\nLimit: ${budgetEvent.limit.toFixed(2)}`,
          successActions,
        );
      } else {
        Alert.alert(
          isEditing ? 'Updated' : 'Saved',
          isEditing
            ? 'Expense updated successfully.'
            : 'Expense recorded successfully.',
          isEditing
            ? successActions
            : [
                {text: 'Add Another'},
                {
                  text: 'Dashboard',
                  onPress: () => navigation.navigate('Dashboard'),
                },
              ],
        );
      }
    } catch {
      Alert.alert(
        'Error',
        isEditing
          ? 'Could not update expense. Please try again.'
          : 'Could not save expense. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }, [
    amount,
    customCategory,
    date,
    expense,
    isEditing,
    navigation,
    note,
    selectedCategory,
    successActions,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor="#C9D0D8"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => shiftDay(-1)}>
              <Text style={styles.dateButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => shiftDay(1)}
              disabled={date >= todayString()}>
              <Text
                style={[
                  styles.dateButtonText,
                  date >= todayString() && styles.dateButtonTextDisabled,
                ]}>
                {'>'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryWrap}>
            {CATEGORIES.map(category => {
              const selected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selected && {
                      borderColor: category.color,
                      backgroundColor: category.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextSelected,
                    ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedCategory === OTHER_CATEGORY_ID && (
            <TextInput
              style={[styles.input, styles.customCategoryInput]}
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Describe this category"
              placeholderTextColor={TEXT_SEC}
              maxLength={40}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Example: lunch with team"
            placeholderTextColor={TEXT_SEC}
            multiline
            maxLength={120}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving
              ? isEditing
                ? 'Updating...'
                : 'Saving...'
              : isEditing
              ? 'Update Expense'
              : 'Save Expense'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: BG},
  container: {padding: 16, paddingBottom: 40},
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SEC,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    padding: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {fontSize: 18, fontWeight: '700', color: PRIMARY},
  dateButtonTextDisabled: {color: '#C9D0D8'},
  dateText: {fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY},
  categoryWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryIcon: {fontSize: 14},
  categoryText: {fontSize: 13, color: TEXT_PRIMARY, fontWeight: '500'},
  categoryTextSelected: {color: '#FFFFFF'},
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT_PRIMARY,
    backgroundColor: '#FAFAFA',
  },
  customCategoryInput: {marginTop: 12},
  noteInput: {minHeight: 72, textAlignVertical: 'top'},
  saveButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {opacity: 0.6},
  saveButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
});
