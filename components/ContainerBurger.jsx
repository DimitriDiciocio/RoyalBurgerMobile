import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import DivisorDot from 'assets/divisor_dot.svg'

export default function ContainerBurger({ }) {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          style={styles.image}
        />
        <View style={styles.container2}>
          <Text style={styles.title}>Nome produto</Text>
          <Text style={styles.description}>Descrição dos itens ...</Text>
          <Text style={styles.price}>R$50,00</Text>
          <View style={styles.flex_row}>
            <Text style={styles.time}>40 - 50 min</Text>
            <DivisorDot></DivisorDot>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  imageWrapper: {
    width: 140,
    height: 95,
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
  },
  image: {
    width: 140,
    height: 95,
  },
  container2: {
    paddingLeft: 8,
    paddingTop: 5,
  },
  title: {
    fontSize: 12,
  },
  description: {
    fontSize: 12,
    color: '#525252',
  },
  price: {
    fontSize: 14,
  },
  flex_row: {
    flexDirection: 'row',
  },
  time: {
    fontSize: 10,
    color: '#888888',
  }
});