/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {colors} from './src/theme/colors';
import {UserProvider} from './src/context/UserContext';
import {NotificationProvider} from './src/context/NotificationContext';

function App(): React.JSX.Element {
  return (
    <UserProvider>
      <NotificationProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <SafeAreaView style={styles.container}>
          <AppNavigator />
        </SafeAreaView>
      </NotificationProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
