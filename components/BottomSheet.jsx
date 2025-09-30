import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native';

const { height } = Dimensions.get('window');

export default function BottomSheet({ visible, onClose, children, heightPercentage = 0.7 }) {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      // Anima para cima quando abre
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Anima para baixo quando fecha
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // PanResponder para arrastar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Só ativa se arrastar mais de 5px verticalmente
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Só permite arrastar para baixo (dy positivo)
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Se arrastar mais de 100px para baixo, fecha
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          // Senão, volta para a posição original
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  height: `${heightPercentage * 100}%`,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Indicador de arrastar */}
              <View style={styles.dragIndicatorContainer} {...panResponder.panHandlers}>
                <TouchableOpacity onPress={handleClose} style={styles.dragIndicatorTouchArea}>
                  <View style={styles.dragIndicator} />
                </TouchableOpacity>
              </View>

              {/* Conteúdo */}
              <View style={styles.content}>{children}</View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
  },
  dragIndicatorTouchArea: {
    padding: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D9D9D9',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
