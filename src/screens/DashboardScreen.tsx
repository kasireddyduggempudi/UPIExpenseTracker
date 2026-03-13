import React, {useCallback, useMemo, useState} from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {PieChart} from 'react-native-chart-kit';
import {RootStackParamList} from '../navigation/types';
import {
  DashboardStats,
  getDashboardStats,
} from '../services/transactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const colors = [
  '#115e59',
  '#0f766e',
  '#14b8a6',
  '#f97316',
  '#eab308',
  '#38bdf8',
];

const initialStats: DashboardStats = {
  monthlySpend: 0,
  weeklySpend: 0,
  categorySpend: [],
};

export const DashboardScreen = ({navigation}: Props) => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  useFocusEffect(
    useCallback(() => {
      getDashboardStats()
        .then(setStats)
        .catch(() => {
          setStats(initialStats);
        });
    }, []),
  );

  const chartData = useMemo(
    () =>
      stats.categorySpend.map((item, index) => ({
        name: item.category,
        amount: item.total,
        color: colors[index % colors.length],
        legendFontColor: '#334155',
        legendFontSize: 12,
      })),
    [stats.categorySpend],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Monthly Spend</Text>
          <Text style={styles.metricValue}>
            INR {stats.monthlySpend.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Weekly Spend</Text>
          <Text style={styles.metricValue}>
            INR {stats.weeklySpend.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Category Breakdown</Text>
        {chartData.length > 0 ? (
          <PieChart
            data={chartData}
            width={Dimensions.get('window').width - 56}
            height={230}
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: () => '#0f172a',
              labelColor: () => '#334155',
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="12"
            absolute
            hasLegend
          />
        ) : (
          <Text style={styles.emptyText}>No transactions available yet.</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Payment')}>
        <Text style={styles.primaryButtonText}>New Payment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('History')}>
        <Text style={styles.secondaryButtonText}>View History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dae3ee',
    padding: 14,
  },
  metricLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },
  chartCard: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dae3ee',
    padding: 12,
  },
  chartTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    marginVertical: 20,
    textAlign: 'center',
    color: '#64748b',
  },
  primaryButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#115e59',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
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
});
