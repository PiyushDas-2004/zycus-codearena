import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { ProductListScreen } from './src/screens/ProductListScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ProductListScreen onOpenProduct={(id) => console.log('open product', id)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F9FC' },
});
