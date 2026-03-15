import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {
  deleteExpense,
  getTransactionsByMonth,
} from '../services/transactionService';
import {Transaction} from '../models/Transaction';
import {CategorySummary} from '../models/Summary';
import {CATEGORY_MAP} from '../utils/constants';
import {
  formatAmount,
  formatDateDisplay,
  monthFullLabel,
} from '../utils/dateUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'MonthDetail'>;

const PRIMARY = '#2D6A4F';
const BG = '#F8FAF9';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1B1B2F';
const TEXT_SEC = '#6B7280';
const DANGER = '#EF4444';

function buildSummaries(transactions: Transaction[]): CategorySummary[] {
  const map: Record<string, CategorySummary> = {};

  for (const transaction of transactions) {
    const categoryMeta = CATEGORY_MAP[transaction.category];
    if (!map[transaction.category]) {
      map[transaction.category] = {
        categoryId: transaction.category,
        categoryLabel:
          categoryMeta?.label ??
          transaction.customCategory ??
          transaction.category,
        color: categoryMeta?.color ?? '#95A5A6',
        total: 0,
        count: 0,
      };
    }

    map[transaction.category].total += transaction.amount;
    map[transaction.category].count += 1;
  }

  return Object.values(map).sort((a, b) => b.total - a.total);
}

function TransactionRow({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete: (id: string) => void;
}) {
  const categoryMeta = CATEGORY_MAP[transaction.category];
  const label =
    transaction.category === 'other' && transaction.customCategory
      ? transaction.customCategory
      : categoryMeta?.label ?? transaction.category;
  const color = categoryMeta?.color ?? '#95A5A6';
  const icon = categoryMeta?.icon ?? '*';

  const confirmDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Delete ${formatAmount(transaction.amount)} - ${label}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(transaction.id),
        },
      ],
    );
  };

  return (
    <View style={styles.transactionCard}>
      <View style={[styles.iconWrap, {backgroundColor: `${color}20`}]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.transactionBody}>
        <Text style={styles.transactionLabel}>{label}</Text>
        {transaction.note ? (
          <Text style={styles.transactionNote} numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : null}
        <Text style={styles.transactionDate}>
          {formatDateDisplay(transaction.date)}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>
          {formatAmount(transaction.amount)}
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteText}>x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function MonthDetailScreen({route, navigation}: Props) {
  const {year, month, label} = route.params;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getTransactionsByMonth(year, month);
      setTransactions(rows);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    navigation.setOptions({title: monthFullLabel(year, month)});
    load();
  }, [navigation, year, month, load]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteExpense(id);
      setTransactions(prev => prev.filter(item => item.id !== id));
    } catch {
      Alert.alert('Error', 'Could not delete this expense.');
    }
  }, []);

  const categorySummaries = buildSummaries(transactions);
  const total = transactions.reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.container}
      data={transactions}
      keyExtractor={item => item.id}
      renderItem={({item}) => (
        <TransactionRow transaction={item} onDelete={handleDelete} />
      )}
      ListHeaderComponent={
        <>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>{label} Total</Text>
            <Text style={styles.totalAmount}>{formatAmount(total)}</Text>
          </View>

          {categorySummaries.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>By Category</Text>
              {categorySummaries.map(summary => (
                <View key={summary.categoryId} style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    <View
                      style={[styles.dot, {backgroundColor: summary.color}]}
                    />
                    <Text style={styles.summaryLabel}>
                      {summary.categoryLabel}
                    </Text>
                    <Text style={styles.summaryCount}>{summary.count}x</Text>
                  </View>
                  <Text style={styles.summaryAmount}>
                    {formatAmount(summary.total)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>
            Transactions ({transactions.length})
          </Text>
        </>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No expenses recorded this month.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: BG},
  container: {padding: 16, paddingBottom: 40},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  totalCard: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_SEC,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  dot: {width: 9, height: 9, borderRadius: 5, marginRight: 8},
  summaryLabel: {flex: 1, fontSize: 14, color: TEXT_PRIMARY, fontWeight: '500'},
  summaryCount: {fontSize: 12, color: TEXT_SEC, marginLeft: 4},
  summaryAmount: {fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY},
  transactionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {fontSize: 20},
  transactionBody: {flex: 1},
  transactionLabel: {fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY},
  transactionNote: {fontSize: 12, color: TEXT_SEC, marginTop: 2},
  transactionDate: {fontSize: 11, color: TEXT_SEC, marginTop: 3},
  transactionRight: {alignItems: 'flex-end', gap: 6},
  transactionAmount: {fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY},
  deleteButton: {padding: 4},
  deleteText: {fontSize: 13, color: DANGER},
  emptyText: {
    textAlign: 'center',
    color: TEXT_SEC,
    fontSize: 15,
    marginTop: 30,
  },
});
