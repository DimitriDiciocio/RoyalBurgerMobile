import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';

export default function BotaoCheck({ title, description, iconSvg, onPress }) {
  return (
    <View style={styles.settingItemWithIcon}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <TouchableOpacity style={styles.iconButton} onPress={onPress}>
        <SvgXml xml={iconSvg} width={17} height={17} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  settingItemWithIcon: {
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
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
