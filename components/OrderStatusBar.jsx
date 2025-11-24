import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function OrderStatusBar({ status }) {
  // ALTERAÇÃO: Normalizar status para minúsculas e remover espaços
  const normalizedStatus = (status || '').toLowerCase().trim();
  
  // ALTERAÇÃO: Mapear status para mensagens (incluindo todos os status possíveis da API)
  const statusMessages = {
    'pending': 'Seu pedido está sendo processado!',
    'preparing': 'Seu pedido está sendo preparado!',
    'ready': 'Seu pedido está pronto!',
    'pronto': 'Seu pedido está pronto!', // ALTERAÇÃO: Status em português
    'in_progress': 'Seu pedido está pronto!', // ALTERAÇÃO: Fallback para ready - mesma mensagem
    'processing': 'Seu pedido está sendo processado!',
    'confirmed': 'Seu pedido foi confirmado!',
    'awaiting_payment': 'Aguardando pagamento',
    'active_table': 'Mesa ativa', // ALTERAÇÃO: Status para pedidos on-site
    'on_the_way': 'Seu pedido está em rota de entrega!',
    'out_for_delivery': 'Seu pedido está em rota de entrega!', // ALTERAÇÃO: Sinônimo de on_the_way
    'delivered': 'Seu pedido foi entregue!',
    'paid': 'Seu pedido foi pago!',
    'completed': 'Seu pedido foi concluído!',
    'cancelled': 'Seu pedido foi cancelado.'
  };

  // ALTERAÇÃO: Mapear status para etapas completas (incluindo todos os status possíveis)
  const getStepConfig = (status) => {
    const steps = {
      'pending': { pending: true, preparing: false, delivered: false },
      'processing': { pending: true, preparing: false, delivered: false },
      'confirmed': { pending: true, preparing: false, delivered: false },
      'awaiting_payment': { pending: true, preparing: false, delivered: false },
      'active_table': { pending: true, preparing: false, delivered: false },
      'preparing': { pending: true, preparing: true, delivered: false },
      'ready': { pending: true, preparing: true, delivered: false }, // ALTERAÇÃO: Preenche segunda barrinha
      'in_progress': { pending: true, preparing: true, delivered: false }, // ALTERAÇÃO: Fallback para ready
      'on_the_way': { pending: true, preparing: true, delivered: false },
      'out_for_delivery': { pending: true, preparing: true, delivered: false }, // ALTERAÇÃO: Sinônimo de on_the_way
      'delivered': { pending: true, preparing: true, delivered: true },
      'paid': { pending: true, preparing: true, delivered: true },
      'completed': { pending: true, preparing: true, delivered: true },
      'cancelled': { pending: false, preparing: false, delivered: false }
    };
    return steps[status] || steps['pending'];
  };

  const stepConfig = getStepConfig(normalizedStatus);
  const statusMessage = statusMessages[normalizedStatus] || `Status: ${status || 'desconhecido'}`;

  // Componente de barra com animação
  const AnimatedStep = ({ isComplete, isMiddle = false }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isComplete) {
        // Animação shimmer (vai e volta)
        const shimmerAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );

        // Animação pulse (alterna cor)
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
        );

        shimmerAnimation.start();
        pulseAnimation.start();

        return () => {
          shimmerAnimation.stop();
          pulseAnimation.stop();
        };
      }
    }, [isComplete, shimmerAnim, pulseAnim]);

    const shimmerTranslateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-130, 130],
    });

    const shimmerOpacity = shimmerAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.7, 0],
    });

    const backgroundColor = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#4CAF50', '#81C784'],
    });

    return (
      <View style={[styles.step, isMiddle && styles.stepMiddle, !isComplete && styles.stepIncomplete]}>
        {isComplete && (
          <>
            <Animated.View
              style={[
                styles.stepBackground,
                { backgroundColor },
              ]}
            />
            <Animated.View
              style={[
                styles.shimmerContainer,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    opacity: shimmerOpacity,
                  },
                ]}
              />
            </Animated.View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.statusMessage}>{statusMessage}</Text>
      
      <View style={styles.progressBar}>
        <AnimatedStep isComplete={stepConfig.pending} />
        <AnimatedStep isComplete={stepConfig.preparing} isMiddle={true} />
        <AnimatedStep isComplete={stepConfig.delivered} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16, // ALTERAÇÃO: Reduzido de 30 para 16 para diminuir espaçamento
  },
  statusMessage: {
    color: '#101010',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
  },
  step: {
    flex: 1,
    maxWidth: 130,
    height: 5,
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  stepIncomplete: {
    backgroundColor: '#D9D9D9',
  },
  stepMiddle: {
    marginHorizontal: 5,
  },
  stepBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 130,
    height: 5,
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 100,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
});

