import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar, StyleSheet} from 'react-native';
import {AppNavigator} from './src/navigation/AppNavigator';

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f4f7fb',
    card: '#ffffff',
    text: '#0f172a',
    border: '#dce3ed',
    primary: '#115e59',
  },
};

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer theme={appTheme}>
        <StatusBar barStyle="dark-content" backgroundColor="#f4f7fb" />
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
