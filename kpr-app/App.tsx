import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import OwnerDashboard from './src/screens/Pods/OwnerDashboard';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <SafeAreaView style={styles.container}>
        <OwnerDashboard />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
});
