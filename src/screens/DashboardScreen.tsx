import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {CategorySummary, MonthlySummary} from '../models/Summary';
import {formatAmount} from '../utils/dateUtils';
import {
  getLast2YearsMonthlySummaries,
  getMonthlyLimit,
  setMonthlyLimit,
} from '../services/transactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const PRIMARY = '#2D6A4F';
const BG = '#F8FAF9';
const CARD = '#FFFFFF';
const TEXT = '#1B1B2F';
const MUTED = '#6B7280';

function CategoryLine({item}: {item: CategorySummary}) {
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryLeft}>
        <View style={[styles.dot, {backgroundColor: item.color}]} />
        <Text style={styles.categoryLabel} numberOfLines={1}>
          {item.categoryLabel}
        </Text>
        <Text style={styles.categoryCount}>{item.count}x</Text>
      </View>
      <Text style={styles.categoryAmount}>{formatAmount(item.total)}</Text>
    </View>
  );
}

export function DashboardScreen({navigation}: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<MonthlySummary | null>(null);
  const [monthlyLimit, setMonthlyLimitState] = useState<number | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const [summaries, limit] = await Promise.all([
        getLast2YearsMonthlySummaries(),
        getMonthlyLimit(),
      ]);
      const now = new Date();
      const summaryForCurrentMonth = summaries.find(
        summary =>
          summary.year === now.getFullYear() &&
          summary.month === now.getMonth() + 1,
      );
      setCurrentMonth(summaryForCurrentMonth ?? null);
      setMonthlyLimitState(limit);
      setLimitInput(limit ? String(limit) : '');
      setIsEditingLimit(!limit);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const topCategories = useMemo(
    () =>
      [...(currentMonth?.categories ?? [])].sort((a, b) => b.total - a.total),
    [currentMonth],
  );

  const spent = currentMonth?.total ?? 0;
  const ratio = monthlyLimit && monthlyLimit > 0 ? spent / monthlyLimit : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const remaining = monthlyLimit ? Math.max(0, monthlyLimit - spent) : 0;
  const progressColor =
    pct >= 100 ? '#DC2626' : pct >= 80 ? '#F59E0B' : PRIMARY;
  const progressWidth = `${pct}%` as any;

  const onSaveLimit = useCallback(async () => {
    const parsed = Number(limitInput.trim());
    if (!limitInput.trim()) {
      setSavingLimit(true);
      try {
        await setMonthlyLimit(null);
        setMonthlyLimitState(null);
        setIsEditingLimit(true);
        Alert.alert('Budget Cleared', 'Monthly budget removed.');
      } finally {
        setSavingLimit(false);
      }
      return;
    }

    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert(
        'Invalid Limit',
        'Please enter a valid amount greater than 0.',
      );
      return;
    }

    setSavingLimit(true);
    try {
      await setMonthlyLimit(parsed);
      setMonthlyLimitState(parsed);
      setIsEditingLimit(false);
      Alert.alert('Budget Saved', 'Monthly budget updated successfully.');
    } finally {
      setSavingLimit(false);
    }
  }, [limitInput]);

  const onLimitButtonPress = useCallback(() => {
    if (monthlyLimit && !isEditingLimit) {
      setIsEditingLimit(true);
      return;
    }
    onSaveLimit();
  }, [isEditingLimit, monthlyLimit, onSaveLimit]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>This Month</Text>
          <Text style={styles.heroAmount}>
            {formatAmount(currentMonth?.total ?? 0)}
          </Text>
          <Text style={styles.heroSub}>
            {currentMonth?.label ?? 'No data yet'}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Monthly Budget</Text>
          <View style={styles.budgetRow}>
            <TextInput
              style={[
                styles.budgetInput,
                !isEditingLimit && styles.budgetInputDisabled,
              ]}
              value={limitInput}
              onChangeText={setLimitInput}
              placeholder="Set monthly limit"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              editable={isEditingLimit}
            />
            <TouchableOpacity
              style={[
                styles.budgetBtn,
                savingLimit && styles.budgetBtnDisabled,
              ]}
              onPress={onLimitButtonPress}
              disabled={savingLimit}>
              <Text style={styles.budgetBtnText}>
                {savingLimit
                  ? 'Saving...'
                  : monthlyLimit && !isEditingLimit
                  ? '✎'
                  : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {monthlyLimit ? (
            <>
              <Text style={styles.budgetMeta}>
                Spent {formatAmount(spent)} of {formatAmount(monthlyLimit)} (
                {pct}%)
              </Text>
              <Text style={styles.budgetRemaining}>
                Remaining: {formatAmount(remaining)}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {width: progressWidth},
                    {backgroundColor: progressColor},
                  ]}
                />
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>No monthly budget set yet.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Category Summary</Text>
          {topCategories.length === 0 ? (
            <Text style={styles.emptyText}>No expenses recorded yet.</Text>
          ) : (
            topCategories.map(category => (
              <CategoryLine key={category.categoryId} item={category} />
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.navItem, styles.navActive]}
          activeOpacity={0.9}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('History')}>
          <Text style={styles.navIcon}>🧾</Text>
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ManageCategories')}>
          <Text style={styles.navIcon}>🏷️</Text>
          <Text style={styles.navText}>Categories</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: BG},
  scroll: {flex: 1},
  content: {padding: 16, paddingBottom: 120},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },

  heroCard: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  heroLabel: {color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600'},
  heroAmount: {color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 4},
  heroSub: {color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2},

  sectionCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  budgetRow: {flexDirection: 'row', gap: 10, alignItems: 'center'},
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: TEXT,
  },
  budgetInputDisabled: {
    color: MUTED,
    backgroundColor: '#F3F4F6',
  },
  budgetBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetBtnDisabled: {opacity: 0.6},
  budgetBtnText: {color: '#FFF', fontSize: 13, fontWeight: '700'},
  budgetMeta: {marginTop: 10, color: TEXT, fontSize: 13, fontWeight: '500'},
  budgetRemaining: {
    marginTop: 4,
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {height: 8, borderRadius: 4},
  sectionTitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  dot: {width: 8, height: 8, borderRadius: 4, marginRight: 8},
  categoryLabel: {flex: 1, color: TEXT, fontSize: 14, fontWeight: '500'},
  categoryCount: {color: MUTED, fontSize: 12, marginLeft: 6},
  categoryAmount: {color: TEXT, fontSize: 14, fontWeight: '700'},

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  fabText: {color: '#FFF', fontSize: 28, fontWeight: '300', marginTop: -2},

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },
  navItem: {alignItems: 'center', justifyContent: 'center', minWidth: 80},
  navActive: {opacity: 1},
  navIcon: {fontSize: 20, marginBottom: 2},
  navText: {fontSize: 12, color: MUTED, fontWeight: '600'},
  navTextActive: {color: PRIMARY},
});
