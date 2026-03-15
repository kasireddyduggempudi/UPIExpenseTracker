import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar, StyleSheet} from 'react-native';
import {AppNavigator} from './src/navigation/AppNavigator';

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8FAF9',
    card: '#FFFFFF',
    text: '#1B1B2F',
    border: '#E5E7EB',
    primary: '#2D6A4F',
  },
};

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer theme={appTheme}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" />
        <AppNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
