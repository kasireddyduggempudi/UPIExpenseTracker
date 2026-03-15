import React, {useEffect} from 'react';
import {Alert} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {initTransactionService} from '../services/transactionService';
import {DashboardScreen} from '../screens/DashboardScreen';
import {AddExpenseScreen} from '../screens/AddExpenseScreen';
import {MonthDetailScreen} from '../screens/MonthDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: {backgroundColor: '#FFFFFF'},
  headerTitleStyle: {fontWeight: '700' as const},
  headerTintColor: '#2D6A4F',
  contentStyle: {backgroundColor: '#F8FAF9'},
};

export function AppNavigator() {
  useEffect(() => {
    initTransactionService().catch(() => {
      Alert.alert('Database Error', 'Could not initialize local database.');
    });
  }, []);

  return (
    <Stack.Navigator initialRouteName="Dashboard" screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{title: 'DKLedger'}}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{title: 'Add Expense'}}
      />
      <Stack.Screen
        name="MonthDetail"
        component={MonthDetailScreen}
        options={{title: ''}}
      />
    </Stack.Navigator>
  );
}
