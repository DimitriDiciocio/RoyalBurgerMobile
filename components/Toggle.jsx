import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';

export default function Toggle({ value, onValueChange, disabled = false }) {
    const toggleAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(toggleAnimation, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    return (
        <TouchableOpacity 
            onPress={onValueChange}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <Animated.View style={[
                styles.toggle, 
                {
                    backgroundColor: toggleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#CCCCCC', '#FFC700']
                    }),
                    opacity: disabled ? 0.5 : 1
                }
            ]}>
                <Animated.View style={[
                    styles.toggleCircle,
                    {
                        transform: [{
                            translateX: toggleAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 22]
                            })
                        }]
                    }
                ]} />
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
    },
});

