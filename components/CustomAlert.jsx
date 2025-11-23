import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

// ALTERAÇÃO: Logo do Royal Burger ao invés de SVG da coroa

/**
 * Componente de Alert customizado com estilo Royal Burger
 * ALTERAÇÃO: Componente de alerta estilizado com coroa e cores por tipo
 * @param {boolean} visible - Controla visibilidade do modal
 * @param {string} type - Tipo do alert: 'delete', 'success', 'warning', 'info'
 * @param {string} title - Título do alert
 * @param {string} message - Mensagem do alert
 * @param {Array} buttons - Array de botões [{text, onPress, style?}]
 * @param {Function} onClose - Função chamada ao fechar
 */
const CustomAlert = ({ visible, type = 'info', title, message, buttons = [], onClose }) => {
  // ALTERAÇÃO: Configuração de cores por tipo
  const getTypeConfig = () => {
    switch (type) {
      case 'delete':
        return {
          iconBg: '#FFE5E5', // Rosa claro
          confirmButtonBg: '#F44336', // Vermelho
          confirmButtonText: '#FFFFFF',
          cancelButtonBg: '#E0E0E0', // Cinza claro
          cancelButtonText: '#000000',
        };
      case 'success':
        return {
          iconBg: '#E8F5E9', // Verde claro
          confirmButtonBg: '#4CAF50', // Verde
          confirmButtonText: '#FFFFFF',
        };
      case 'warning':
        return {
          iconBg: '#FFF9C4', // Amarelo claro
          confirmButtonBg: '#FFC700', // Amarelo dourado
          confirmButtonText: '#000000',
          cancelButtonBg: '#E0E0E0', // Cinza claro
          cancelButtonText: '#000000',
        };
      case 'info':
      default:
        return {
          iconBg: '#F3E5F5', // Roxo claro
          confirmButtonBg: '#9C27B0', // Roxo
          confirmButtonText: '#FFFFFF',
        };
    }
  };

  const config = getTypeConfig();

  // ALTERAÇÃO: Renderizar botões
  const renderButtons = () => {
    if (buttons.length === 0) {
      return (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: config.confirmButtonBg }]}
          onPress={() => {
            onClose?.();
          }}
        >
          <Text style={[styles.buttonText, { color: config.confirmButtonText }]}>
            Confirmar
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.buttonsContainer}>
        {buttons.map((button, index) => {
          const isCancel = button.style === 'cancel';
          const buttonBg = isCancel ? config.cancelButtonBg : config.confirmButtonBg;
          const buttonText = isCancel ? config.cancelButtonText : config.confirmButtonText;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.button, { backgroundColor: buttonBg }]}
              onPress={() => {
                button.onPress?.();
                if (!button.keepOpen) {
                  onClose?.();
                }
              }}
            >
              <Text style={[styles.buttonText, { color: buttonText }]}>
                {button.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* ALTERAÇÃO: Quadrado colorido centralizado com logo no canto superior esquerdo rotacionada 45 graus */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: config.iconBg }]}>
              <Image 
                source={require('../assets/img/logoIcon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ALTERAÇÃO: Título */}
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}

          {/* ALTERAÇÃO: Mensagem */}
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {/* ALTERAÇÃO: Botões */}
          {renderButtons()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative', // ALTERAÇÃO: Para posicionar a logo absolutamente
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoImage: {
    width: 40,
    height: 40,
    position: 'absolute',
    top: -20,
    left: -20,
    transform: [{ rotate: '315deg' }], // ALTERAÇÃO: Logo rotacionada 45 graus no canto superior esquerdo
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;

