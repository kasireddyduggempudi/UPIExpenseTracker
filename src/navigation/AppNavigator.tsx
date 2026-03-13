import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Alert} from 'react-native';
import {PaymentScreen} from '../screens/PaymentScreen';
import {ScannerScreen} from '../screens/ScannerScreen';
import {DashboardScreen} from '../screens/DashboardScreen';
import {HistoryScreen} from '../screens/HistoryScreen';
import {RootStackParamList} from './types';
import {initializeTransactionStore} from '../services/transactionService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  useEffect(() => {
    initializeTransactionStore().catch(() => {
      Alert.alert('Database Error', 'Could not initialize local database.');
    });
  }, []);

  return (
    <Stack.Navigator
      initialRouteName="Payment"
      screenOptions={{
        headerStyle: {backgroundColor: '#ffffff'},
        headerTitleStyle: {fontWeight: '700'},
        contentStyle: {backgroundColor: '#f4f7fb'},
      }}>
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{title: 'New Payment'}}
      />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{title: 'Scan UPI QR'}}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{title: 'Dashboard'}}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{title: 'Transaction History'}}
      />
    </Stack.Navigator>
  );
};
