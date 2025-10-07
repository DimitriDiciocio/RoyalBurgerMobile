import React, { useState } from 'react';
import {StyleSheet, View, TextInput, Text, TouchableOpacity, Animated} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Input({
                                  label = "",
                                  placeholder = "",
                                  type = "text",
                                  value = "",
                                  onChangeText = () => {},
                                  error = null,
                                  style = {},
                                  isValid = false,
                                  isValidating = false,
                                  ...props
                              }) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Animação para o floating label
    const labelAnimation = useState(new Animated.Value(value ? 1 : 0))[0];

    const isPassword = type === "password";
    const hasValue = value && value.length > 0;
    const shouldLabelFloat = isFocused || hasValue;

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const getKeyboardType = () => {
        switch (type) {
            case "email":
                return "email-address";
            case "phone":
                return "phone-pad";
            case "number":
                return "numeric";
            case "date":
                return "numeric";
            default:
                return "default";
        }
    };

    const getAutoCapitalize = () => {
        switch (type) {
            case "email":
                return "none";
            default:
                return "sentences";
        }
    };

    // Animação do label
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
        if (props.onFocus) {
            props.onFocus();
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (!hasValue) {
            animateLabel(0);
        }
        if (props.onBlur) {
            props.onBlur();
        }
    };

    // Validação em tempo real para email
    const validateEmail = (email) => {
        if (type === 'email' && email.length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }
        return true;
    };

    // Validação em tempo real para senha
    const validatePassword = (password) => {
        if (type === 'password' && password.length > 0) {
            return password.length >= 6;
        }
        return true;
    };

    // Função para verificar se deve mostrar erro
    const shouldShowError = () => {
        // Exibe erro somente quando prop error vier preenchida
        return Boolean(error && typeof error === 'string' && error.length > 0);
    };

    // Estilos animados do label
    const labelStyle = {
        position: 'absolute',
        left: 16,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 4,
        zIndex: 1,
        pointerEvents: 'none', // Permite cliques passarem através do label
        fontSize: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 12], // Tamanho normal -> menor
        }),
        top: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [12, -6], 
        }),
        color: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['#AEAEBA', isFocused ? '#3D1807' : '#AEAEBA'], // Cor normal -> cor ativa
        }),
    };

    return (
        <View style={[styles.container, style]}>
            <View style={[
                styles.inputContainer,
                isFocused && styles.inputFocused,
                error && styles.inputError,
                isValid && styles.inputValid,
                isValidating && styles.inputValidating
            ]}>
                {label && (
                    <Animated.Text style={labelStyle}>
                        {label}
                    </Animated.Text>
                )}

                <TextInput
                    style={[styles.input, isPassword && styles.inputWithIcon]}
                    placeholder={shouldLabelFloat ? "" : placeholder}
                    placeholderTextColor="#3D1807"
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={isPassword && !isPasswordVisible}
                    keyboardType={getKeyboardType()}
                    autoCapitalize={getAutoCapitalize()}
                    autoCorrect={false}
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={togglePasswordVisibility}
                    >
                        <Ionicons
                            name={isPasswordVisible ? "eye-off" : "eye"}
                            size={18}
                            color="#AEAEBA"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {shouldShowError() && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputContainer: {
        position: 'relative',
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e1e4',
        height: 48,
        justifyContent: 'center',
    },
    inputFocused: {
        borderColor: '#3D1807',
    },
    inputError: {
        borderColor: '#FF4444',
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#262627',
        paddingHorizontal: 16,
        paddingVertical: 12,
        zIndex: 2,
        backgroundColor: 'transparent',
    },
    inputWithIcon: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -9 }],
        zIndex: 99,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#FF4444',
        fontSize: 12,
        marginTop: 8,
        marginLeft: 4,
        fontWeight: '500',
    },
    inputValid: {
        borderColor: '#4CAF50',
    },
    inputValidating: {
        borderColor: '#FFC700',
    },
});
