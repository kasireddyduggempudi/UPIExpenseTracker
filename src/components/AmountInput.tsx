import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const AmountInput = ({value, onChangeText}: AmountInputProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Amount</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.currency}>INR</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={styles.input}
          placeholderTextColor="#64748b"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6dee8',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  currency: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#0f172a',
    fontSize: 16,
  },
});
