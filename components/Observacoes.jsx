import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';

export default function Observacoes({
    value = '',
    onChangeText = () => {},
    maxLength = 140,
    style = {},
}) {
    const [isFocused, setIsFocused] = useState(false);
    const labelAnimation = useState(new Animated.Value(value ? 1 : 0))[0];
    const hasValue = value && value.length > 0;
    const shouldLabelFloat = isFocused || hasValue;
    const remaining = `${(value?.length || 0)}/${maxLength}`;

    const animateLabel = (toValue) => {
        Animated.timing(labelAnimation, {
            toValue,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleFocus = () => {
        setIsFocused(true);
        animateLabel(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (!hasValue) animateLabel(0);
    };

    const labelStyle = {
        position: 'absolute',
        left: 16,
        backgroundColor: '#F6F6F6',
        paddingHorizontal: 6,
        zIndex: 2,
        fontSize: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 12],
        }),
        top: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [12, -8],
        }),
        color: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['#AEAEBA', '#3D1807'],
        }),
    };

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.textAreaContainer, isFocused && styles.textAreaFocused]}>
                <Animated.Text style={labelStyle}>Observações</Animated.Text>
                <Text style={styles.counter}>{remaining}</Text>
                <TextInput
                    style={styles.textArea}
                    value={value}
                    onChangeText={onChangeText}
                    maxLength={maxLength}
                    multiline
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    textAlignVertical="top"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginTop: 10,
    },
    textAreaContainer: {
        position: 'relative',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F6F6F6',
        minHeight: 110,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    textAreaFocused: {
        borderColor: '#3D1807',
    },
    counter: {
        position: 'absolute',
        right: 10,
        top: -25,
        backgroundColor: 'transparent',
        color: '#9CA3AF',
        fontSize: 12,
        zIndex: 2,
    },
    textArea: {
        minHeight: 86,
        color: '#111827',
    },
});


