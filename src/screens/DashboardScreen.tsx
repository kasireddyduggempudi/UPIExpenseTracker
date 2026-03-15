import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {
  getLast2YearsMonthlySummaries,
  getLast5YearsYearlySummaries,
} from '../services/transactionService';
import {
  CategorySummary,
  MonthlySummary,
  YearlySummary,
} from '../models/Summary';
import {formatAmount} from '../utils/dateUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
type Tab = 'monthly' | 'yearly';

const PRIMARY = '#2D6A4F';
const BG = '#F8FAF9';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1B1B2F';
const TEXT_SEC = '#6B7280';

function CategoryRow({
  item,
  maxTotal,
}: {
  item: CategorySummary;
  maxTotal: number;
}) {
  const pct = maxTotal > 0 ? item.total / maxTotal : 0;

  return (
    <View style={styles.catRow}>
      <View style={styles.catMeta}>
        <View style={[styles.catDot, {backgroundColor: item.color}]} />
        <Text style={styles.catName} numberOfLines={1}>
          {item.categoryLabel}
        </Text>
        <Text style={styles.catCount}>{item.count}x</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.round(pct * 100)}%` as any,
              backgroundColor: item.color,
            },
          ]}
        />
      </View>
      <Text style={styles.catAmount}>{formatAmount(item.total)}</Text>
    </View>
  );
}

function MonthCard({
  item,
  onPress,
}: {
  item: MonthlySummary;
  onPress: (value: MonthlySummary) => void;
}) {
  const maxCatTotal = Math.max(...item.categories.map(c => c.total), 1);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.label}</Text>
        <Text style={styles.cardTotal}>{formatAmount(item.total)}</Text>
      </View>
      {item.categories.length === 0 ? (
        <Text style={styles.emptyMsg}>No expenses this month</Text>
      ) : (
        item.categories.map(cat => (
          <CategoryRow key={cat.categoryId} item={cat} maxTotal={maxCatTotal} />
        ))
      )}
    </TouchableOpacity>
  );
}

function YearCard({item}: {item: YearlySummary}) {
  const maxCatTotal = Math.max(...item.categories.map(c => c.total), 1);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.year}</Text>
        <Text style={styles.cardTotal}>{formatAmount(item.total)}</Text>
      </View>
      {item.categories.length === 0 ? (
        <Text style={styles.emptyMsg}>No expenses this year</Text>
      ) : (
        item.categories.map(cat => (
          <CategoryRow key={cat.categoryId} item={cat} maxTotal={maxCatTotal} />
        ))
      )}
    </View>
  );
}

export function DashboardScreen({navigation}: Props) {
  const [tab, setTab] = useState<Tab>('monthly');
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>(
    [],
  );
  const [yearlySummaries, setYearlySummaries] = useState<YearlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [monthly, yearly] = await Promise.all([
        getLast2YearsMonthlySummaries(),
        getLast5YearsYearlySummaries(),
      ]);
      setMonthlySummaries(monthly);
      setYearlySummaries(yearly);
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

  const navigateToMonth = useCallback(
    (item: MonthlySummary) => {
      navigation.navigate('MonthDetail', {
        year: item.year,
        month: item.month,
        label: item.label,
      });
    },
    [navigation],
  );

  const currentMonthSummary = monthlySummaries[0];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>This Month</Text>
        <Text style={styles.heroAmount}>
          {formatAmount(currentMonthSummary?.total ?? 0)}
        </Text>
        {currentMonthSummary && (
          <Text style={styles.heroSub}>{currentMonthSummary.label}</Text>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'monthly' && styles.tabBtnActive]}
          onPress={() => setTab('monthly')}>
          <Text
            style={[styles.tabText, tab === 'monthly' && styles.tabTextActive]}>
            Monthly (2 yr)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'yearly' && styles.tabBtnActive]}
          onPress={() => setTab('yearly')}>
          <Text
            style={[styles.tabText, tab === 'yearly' && styles.tabTextActive]}>
            Yearly (5 yr)
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'monthly' ? (
        <FlatList
          data={monthlySummaries}
          keyExtractor={item => `${item.year}-${item.month}`}
          renderItem={({item}) => (
            <MonthCard item={item} onPress={navigateToMonth} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyList}>
              No data yet. Add your first expense.
            </Text>
          }
        />
      ) : (
        <FlatList
          data={yearlySummaries}
          keyExtractor={item => String(item.year)}
          renderItem={({item}) => <YearCard item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyList}>
              No data yet. Add your first expense.
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: BG},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  heroCard: {
    backgroundColor: PRIMARY,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  heroLabel: {color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600'},
  heroAmount: {color: '#FFFFFF', fontSize: 38, fontWeight: '800', marginTop: 4},
  heroSub: {color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4},
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: CARD_BG,
  },
  tabBtnActive: {borderColor: PRIMARY, backgroundColor: PRIMARY},
  tabText: {fontSize: 13, fontWeight: '600', color: TEXT_SEC},
  tabTextActive: {color: '#FFFFFF'},
  list: {paddingHorizontal: 16, paddingBottom: 100},
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY},
  cardTotal: {fontSize: 16, fontWeight: '700', color: PRIMARY},
  catRow: {marginTop: 2, marginBottom: 6},
  catMeta: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  catDot: {width: 8, height: 8, borderRadius: 4, marginRight: 6},
  catName: {flex: 1, fontSize: 13, color: TEXT_PRIMARY, fontWeight: '500'},
  catCount: {fontSize: 11, color: TEXT_SEC, marginLeft: 4},
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 3,
  },
  barFill: {height: 6, borderRadius: 3},
  catAmount: {fontSize: 12, color: TEXT_SEC, textAlign: 'right'},
  emptyMsg: {
    fontSize: 13,
    color: TEXT_SEC,
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyList: {
    fontSize: 15,
    color: TEXT_SEC,
    textAlign: 'center',
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
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
});
