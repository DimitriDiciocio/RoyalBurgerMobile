import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';

const houseSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.0218 3.40273C15.4453 2.86836 14.5546 2.86836 13.9828 3.40273L3.48277 13.1527C3.03277 13.5746 2.88277 14.2262 3.10777 14.798C3.33277 15.3699 3.8812 15.7496 4.49995 15.7496H5.24995V23.9996C5.24995 25.6543 6.59527 26.9996 8.24995 26.9996H21.75C23.4046 26.9996 24.75 25.6543 24.75 23.9996V15.7496H25.5C26.1187 15.7496 26.6718 15.3699 26.8968 14.798C27.1218 14.2262 26.9718 13.5699 26.5218 13.1527L16.0218 3.40273ZM14.25 17.9996H15.75C16.9921 17.9996 18 19.0074 18 20.2496V24.7496H12V20.2496C12 19.0074 13.0078 17.9996 14.25 17.9996Z" fill="#888888"/>
</svg>`;

const crownSvg = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.08594 3.54375C8.30156 3.37266 8.4375 3.10781 8.4375 2.8125C8.4375 2.29453 8.01797 1.875 7.5 1.875C6.98203 1.875 6.5625 2.29453 6.5625 2.8125C6.5625 3.10781 6.70078 3.37266 6.91406 3.54375L5.31094 6.06562C5.07656 6.43359 4.57734 6.525 4.22812 6.2625L2.83359 5.21953C2.93906 5.06953 3 4.88438 3 4.6875C3 4.16953 2.58047 3.75 2.0625 3.75C1.54453 3.75 1.125 4.16953 1.125 4.6875C1.125 5.19844 1.53516 5.61562 2.04375 5.625L2.80781 10.7227C2.91797 11.4563 3.54844 12 4.29141 12H10.7086C11.4516 12 12.082 11.4563 12.1922 10.7227L12.9562 5.625C13.4648 5.61562 13.875 5.19844 13.875 4.6875C13.875 4.16953 13.4555 3.75 12.9375 3.75C12.4195 3.75 12 4.16953 12 4.6875C12 4.88438 12.0609 5.06953 12.1664 5.21953L10.7742 6.26484C10.425 6.52734 9.92578 6.43594 9.69141 6.06797L8.08594 3.54375Z" fill="#888888"/>
</svg>`;

const pedidoSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.65625 3.10331C7.05469 2.9205 7.52344 2.98613 7.85625 3.27207L9.75 4.89394L11.6437 3.27207C12.0656 2.91113 12.6891 2.91113 13.1063 3.27207L15 4.89394L16.8937 3.27207C17.3156 2.91113 17.9344 2.91113 18.3563 3.27207L20.25 4.89394L22.1437 3.27207C22.4766 2.98613 22.9453 2.9205 23.3438 3.10331C23.7422 3.28613 24 3.68456 24 4.12519V25.8752C24 26.3158 23.7422 26.7143 23.3438 26.8971C22.9453 27.0799 22.4766 27.0143 22.1437 26.7283L20.25 25.1064L18.3563 26.7283C17.9344 27.0893 17.3156 27.0893 16.8937 26.7283L15 25.1064L13.1063 26.7283C12.6844 27.0893 12.0609 27.0893 11.6437 26.7283L9.75 25.1064L7.85625 26.7283C7.52344 27.0143 7.05469 27.0799 6.65625 26.8971C6.25781 26.7143 6 26.3158 6 25.8752V4.12519C6 3.68456 6.25781 3.28613 6.65625 3.10331ZM10.875 9.37519C10.2516 9.37519 9.75 9.87675 9.75 10.5002C9.75 11.1236 10.2516 11.6252 10.875 11.6252H19.125C19.7484 11.6252 20.25 11.1236 20.25 10.5002C20.25 9.87675 19.7484 9.37519 19.125 9.37519H10.875ZM9.75 19.5002C9.75 20.1236 10.2516 20.6252 10.875 20.6252H19.125C19.7484 20.6252 20.25 20.1236 20.25 19.5002C20.25 18.8768 19.7484 18.3752 19.125 18.3752H10.875C10.2516 18.3752 9.75 18.8768 9.75 19.5002ZM10.875 13.8752C10.2516 13.8752 9.75 14.3768 9.75 15.0002C9.75 15.6236 10.2516 16.1252 10.875 16.1252H19.125C19.7484 16.1252 20.25 15.6236 20.25 15.0002C20.25 14.3768 19.7484 13.8752 19.125 13.8752H10.875Z" fill="#888888"/>
</svg>`;

const perfilSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 14.625C18.1078 14.625 20.625 12.1078 20.625 9C20.625 5.89219 18.1078 3.375 15 3.375C11.8922 3.375 9.375 5.89219 9.375 9C9.375 12.1078 11.8922 14.625 15 14.625ZM13.6078 17.25C8.99062 17.25 5.25 20.9906 5.25 25.6078C5.25 26.3766 5.87344 27 6.64219 27H23.3578C24.1266 27 24.75 26.3766 24.75 25.6078C24.75 20.9906 21.0094 17.25 16.3922 17.25H13.6078Z" fill="#888888"/>
</svg>`;

const MenuNavigation = ({ navigation }) => {
  const menuItems = [
    { id: 'home', icon: 'house', label: 'Início', screen: 'Home', type: 'svg' },
    { id: 'menu', icon: 'crown', label: 'Clube Royal', screen: 'ClubeRoyal', type: 'svg' },
    { id: 'logo', icon: 'logo', label: '', screen: 'Home', type: 'logo' },
    { id: 'orders', icon: 'pedido', label: 'Pedidos', screen: 'Pedidos', type: 'svg' },
    { id: 'profile', icon: 'perfil', label: 'Perfil', screen: 'Perfil', type: 'svg' },
  ];

  const getSvgIcon = (iconName) => {
    switch (iconName) {
      case 'house':
        return houseSvg;
      case 'crown':
        return crownSvg;
      case 'pedido':
        return pedidoSvg;
      case 'perfil':
        return perfilSvg;
      default:
        return houseSvg;
    }
  };

  const handleNavigation = (screen) => {
    if (navigation && screen) {
      navigation.navigate(screen);
    }
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item) => {
        // Se for o logo (coroa), renderiza sem TouchableOpacity
        if (item.type === 'logo') {
          return (
            <View key={item.id} style={styles.menuItem}>
              <Image
                source={require('../assets/img/logoIcon.png')}
                style={styles.logoImage}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
          );
        }
        
        // Para outros itens, mantém o TouchableOpacity
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleNavigation(item.screen)}
            activeOpacity={0.7}
          >
            <SvgXml xml={getSvgIcon(item.icon)} width={30} height={30} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 100,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 5,
  },
  menuLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});

export default MenuNavigation;