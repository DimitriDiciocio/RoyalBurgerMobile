import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MenuNavigation = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Navigation</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default MenuNavigation;