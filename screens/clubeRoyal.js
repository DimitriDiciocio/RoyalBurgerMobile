import React from 'react';
import { View, StyleSheet } from 'react-native';
import MenuNavigation from '../components/MenuNavigation';

export default function ClubeRoyal({ navigation }) {
  return (
    <View style={styles.container}>
      <View>
        
      </View>
      <View>
        
      </View>  
      <View style={styles.menuNavigationContainer}>
        <MenuNavigation navigation={navigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  menuNavigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});