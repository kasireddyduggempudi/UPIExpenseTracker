import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {TransactionCard} from '../components/TransactionCard';
import {Transaction} from '../models/Transaction';
import {listTransactions} from '../services/transactionService';

export const HistoryScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      listTransactions()
        .then(setTransactions)
        .catch(() => {
          setTransactions([]);
        });
    }, []),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({item}) => <TransactionCard transaction={item} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions recorded yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },
});
