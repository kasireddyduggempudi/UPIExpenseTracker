import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Transaction} from '../models/Transaction';

interface TransactionCardProps {
  transaction: Transaction;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'SUCCESS':
      return styles.success;
    case 'FAILED':
      return styles.failed;
    default:
      return styles.pending;
  }
};

export const TransactionCard = ({transaction}: TransactionCardProps) => {
  const formattedDate = new Date(transaction.date).toLocaleString();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.category}>{transaction.category}</Text>
        <Text style={styles.amount}>INR {transaction.amount.toFixed(2)}</Text>
      </View>
      <Text style={styles.meta}>UPI: {transaction.upiId}</Text>
      <Text style={styles.meta}>Date: {formattedDate}</Text>
      <View style={[styles.statusPill, getStatusStyle(transaction.status)]}>
        <Text style={styles.statusText}>{transaction.status}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  category: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15,
  },
  amount: {
    color: '#115e59',
    fontWeight: '700',
    fontSize: 16,
  },
  meta: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  success: {
    backgroundColor: '#16a34a',
  },
  failed: {
    backgroundColor: '#dc2626',
  },
  pending: {
    backgroundColor: '#f59e0b',
  },
});
