/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useRef} from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainerRef} from '@react-navigation/native';
import AppNavigator, {RootStackParamList} from './src/navigation/AppNavigator';
import {colors} from './src/theme/colors';
import {UserProvider} from './src/context/UserContext';
import {NotificationProvider} from './src/context/NotificationContext';
import RNBootSplash from 'react-native-bootsplash';

function App(): React.JSX.Element {
  const navRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  useEffect(() => {
    const check = async () => {
      const onboard = await AsyncStorage.getItem('kpr_onboard_done');
      if (!onboard) {
        setTimeout(() => {
          navRef.current?.reset({
            index: 0,
            routes: [{name: 'Onboard1'}],
          });
        }, 0);
      }
  RNBootSplash.hide({fade: true});
    };
    check();
  }, []);

  return (
    <UserProvider>
      <NotificationProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <SafeAreaView style={styles.container}>
          <AppNavigator navigationRef={navRef} />
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
