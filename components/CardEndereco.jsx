import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';

// SVG do ícone de localização
const localizationSvg = `<svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 0C4.48 0 0 4.48 0 10C0 17.5 10 24 10 24C10 24 20 17.5 20 10C20 4.48 15.52 0 10 0ZM10 13.5C8.07 13.5 6.5 11.93 6.5 10C6.5 8.07 8.07 6.5 10 6.5C11.93 6.5 13.5 8.07 13.5 10C13.5 11.93 11.93 13.5 10 13.5Z" fill="#000000"/>
</svg>`;

// SVG do ícone de edição (pen.svg)
const penSvg = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0744 2.26332L9.88173 3.45598L13.5447 7.11895L14.7373 5.92629C15.0986 5.5677 15.3005 5.07895 15.3005 4.56895C15.3005 4.05895 15.0986 3.5702 14.7373 3.2116L13.7891 2.26332C13.4305 1.90207 12.9417 1.7002 12.4317 1.7002C11.9217 1.7002 11.433 1.90207 11.0744 2.26332ZM8.98126 4.35645L3.26501 10.07C2.98079 10.3543 2.7736 10.7102 2.66469 11.098L1.72438 14.4927C1.66329 14.7132 1.72438 14.9522 1.88907 15.1143C2.05376 15.2763 2.29016 15.34 2.51063 15.2789L5.90532 14.336C6.29313 14.2271 6.64641 14.0225 6.93329 13.7357L12.6442 8.01941L8.98126 4.35645Z" fill="white"/>
</svg>`;

export default function CardEndereco({ endereco, complemento, onEdit, onSelect, isActive = false }) {
  return (
    <TouchableOpacity 
      style={[styles.card, isActive && styles.cardActive]} 
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <SvgXml xml={localizationSvg} width={20} height={24} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.endereco}>{endereco}</Text>
        <Text style={styles.complemento}>{complemento}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <SvgXml xml={penSvg} width={17} height={17} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardActive: {
    borderColor: '#FFC700',
    borderWidth: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  endereco: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  complemento: {
    fontSize: 13,
    color: '#888888',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
