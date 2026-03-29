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

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;
type Tab = 'monthly' | 'yearly';

const PRIMARY = '#2D6A4F';
const BG = '#F8FAF9';
const CARD = '#FFFFFF';
const TEXT = '#1B1B2F';
const MUTED = '#6B7280';

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

export function HistoryScreen({navigation}: Props) {
  const [tab, setTab] = useState<Tab>('monthly');
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [yearly, setYearly] = useState<YearlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const [m, y] = await Promise.all([
        getLast2YearsMonthlySummaries(),
        getLast5YearsYearlySummaries(),
      ]);
      setMonthly(m);
      setYearly(y);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
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
          data={monthly}
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
            <Text style={styles.emptyList}>No monthly data.</Text>
          }
        />
      ) : (
        <FlatList
          data={yearly}
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
            <Text style={styles.emptyList}>No yearly data.</Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navActive]}
          activeOpacity={0.9}>
          <Text style={styles.navIcon}>🧾</Text>
          <Text style={[styles.navText, styles.navTextActive]}>History</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
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
    backgroundColor: CARD,
  },
  tabBtnActive: {borderColor: PRIMARY, backgroundColor: PRIMARY},
  tabText: {fontSize: 13, fontWeight: '600', color: MUTED},
  tabTextActive: {color: '#FFFFFF'},
  list: {paddingHorizontal: 16, paddingBottom: 120},
  card: {
    backgroundColor: CARD,
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
  cardTitle: {fontSize: 16, fontWeight: '700', color: TEXT},
  cardTotal: {fontSize: 16, fontWeight: '700', color: PRIMARY},
  catRow: {marginTop: 2, marginBottom: 6},
  catMeta: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  catDot: {width: 8, height: 8, borderRadius: 4, marginRight: 6},
  catName: {flex: 1, fontSize: 13, color: TEXT, fontWeight: '500'},
  catCount: {fontSize: 11, color: MUTED, marginLeft: 4},
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 3,
  },
  barFill: {height: 6, borderRadius: 3},
  catAmount: {fontSize: 12, color: MUTED, textAlign: 'right'},
  emptyMsg: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyList: {
    fontSize: 15,
    color: MUTED,
    textAlign: 'center',
    marginTop: 40,
  },
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
