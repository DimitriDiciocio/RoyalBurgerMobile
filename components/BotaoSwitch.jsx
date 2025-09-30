import React from 'react';
import { View, StyleSheet, Text, Switch } from 'react-native';

export default function BotaoSwitch({ title, description, value, onValueChange }) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D9D9D9', true: '#D9D9D9' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        ios_backgroundColor="#D9D9D9"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 12,
    color: '#A0A0A0',
    lineHeight: 16,
  },
});
