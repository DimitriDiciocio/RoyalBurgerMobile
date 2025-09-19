import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet} from 'react-native';

const TimerPromotions = ({
                             endTime,
                             onExpire = () => {
                             },
                             showLabel = true,
                             style = {}
                         }) => {
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false
    });

    const intervalRef = useRef(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const targetTime = new Date(endTime).getTime();
            const difference = targetTime - now;

            if (difference > 0) {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                return {
                    hours,
                    minutes,
                    seconds,
                    isExpired: false
                };
            } else {
                onExpire();
                return {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isExpired: true
                };
            }
        };

        setTimeLeft(calculateTimeLeft());

        intervalRef.current = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.isExpired) {
                clearInterval(intervalRef.current);
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [endTime, onExpire]);

    const formatNumber = (num) => num.toString().padStart(2, '0');

    if (timeLeft.isExpired) {
        return (
            <View style={[styles.container, style]}>
                <Text style={[styles.label, styles.expiredText]}>Oferta expirada</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {showLabel && (
                <Text style={styles.label}>Essa oferta expira em </Text>
            )}
            <View style={styles.containerTimer}>
                <Text style={styles.timer}>{formatNumber(timeLeft.hours)}</Text>
                <Text>:</Text>
                <Text style={styles.timer}>{formatNumber(timeLeft.minutes)}</Text>
                <Text>:</Text>
                <Text style={styles.timer}>{formatNumber(timeLeft.seconds)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 6,
    },
    label: {
        color: '#525252',
        fontSize: 14,
        fontWeight: '400',
    },
    containerTimer:{
        flexDirection: 'row',
    },
    timer: {
        fontSize: 14,
        backgroundColor: 'rgba(255,199,0,0.5)',
        paddingHorizontal: 2,
        fontWeight: 'bold',
        borderRadius: 5,
        fontFamily: 'monospace',
    },
    expiredText: {
        color: '#FF6B6B',
    }
});

export default TimerPromotions;