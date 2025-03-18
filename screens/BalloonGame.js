import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const BalloonGame = ({ navigation }) => {
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const x = Math.random() * (width - 50);
      const y = Math.random() * (height - 150);
      const id = Math.random().toString();
      setBalloons((prevBalloons) => [...prevBalloons, { x, y, id }]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBalloonPop = (id) => {
    setBalloons((prevBalloons) => prevBalloons.filter((balloon) => balloon.id !== id));
    setScore((prevScore) => prevScore + 1);
  };

  const resetGame = () => {
    setBalloons([]);
    setScore(0);
  };

  useEffect(() => {
    if (score >= 10) {
      Alert.alert('Tebrikler!', '10 balon patlattınız!', [{ text: 'Tekrar Oyna', onPress: resetGame }]);
    }
  }, [score]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Geri Butonu */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.score}>Skor: {score}</Text>
      {balloons.map((balloon) => (
        <TouchableOpacity
          key={balloon.id}
          style={[styles.balloon, { left: balloon.x, top: balloon.y }]}
          onPress={() => handleBalloonPop(balloon.id)}
        />
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: '10%',
    left: 20,
    zIndex: 10,
    
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    position: 'absolute',
    top: '10%',
    right: 20,
    fontFamily:'Avenir'

    
  },
  balloon: {
    width: 70,
    height: 70,
    backgroundColor: 'red',
    borderRadius: 55,
    position: 'absolute',
  },
});

export default BalloonGame;
