import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const generateRandomNumbers = (count, min, max) => {
  const numbers = [];
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers;
};

const MemoryNumbersGame = ({ navigation }) => {
  const [originalSequence, setOriginalSequence] = useState([]);
  const [shuffledNumbers, setShuffledNumbers] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const numbers = generateRandomNumbers(10, 1, 99);
    setOriginalSequence(numbers);
    setShuffledNumbers([...numbers].sort(() => Math.random() - 0.5)); // Karıştır
    setUserSequence([]);
    setIsShowingSequence(true);

    setTimeout(() => {
      setIsShowingSequence(false);
    }, 5000); // 5 saniye boyunca göster
  };

  const handleNumberPress = (number) => {
    if (isShowingSequence) return;

    setUserSequence((prev) => {
      const updatedSequence = [...prev, number];

      if (number !== originalSequence[updatedSequence.length - 1]) {
        Alert.alert('Kaybettiniz!', 'Yanlış sırayı seçtiniz.', [
          { text: 'Tekrar Oyna', onPress: startNewGame },
        ]);
        return [];
      }

      if (updatedSequence.length === originalSequence.length) {
        Alert.alert('Tebrikler!', 'Doğru sırayı buldunuz!', [
          { text: 'Sonraki Seviye', onPress: () => setLevel((prev) => prev + 1) },
        ]);
        startNewGame();
        return [];
      }

      return updatedSequence;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Geri Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.header}>Sayı Hafıza Oyunu</Text>
      <Text style={styles.description}>
        Sayıların sırasını hatırlayın. Doğru sırayla sayılara dokunun!
      </Text>
      <Text style={styles.level}>Seviye: {level}</Text>

      {isShowingSequence ? (
        <View style={styles.sequenceContainer}>
          <Text style={styles.sequenceText}>{originalSequence.join(', ')}</Text>
        </View>
      ) : (
        <FlatList
          data={shuffledNumbers}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.numberButton,
                userSequence.includes(item) && styles.selectedNumberButton, // Seçilen sayılar için stil
              ]}
              onPress={() => handleNumberPress(item)}
            >
              <Text style={styles.numberText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.numberGrid}
        />
      )}

      <TouchableOpacity style={styles.resetButton} onPress={startNewGame}>
        <Text style={styles.resetButtonText}>Tekrar Oyna</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: '10%',
    left: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 80,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Avenir',
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginVertical: 10,
    textAlign: 'center',
    fontFamily: 'Avenir',
  },
  level: {
    fontSize: 18,
    color: '#777',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Avenir',
  },
  sequenceContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sequenceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Avenir',
  },
  numberGrid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButton: {
    width: 80,
    height: 80,
    margin: 10,
    backgroundColor: '#4C6DAFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  selectedNumberButton: {
    backgroundColor: '#36AB42FF', // Seçilen sayılar için kırmızı
  },
  numberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Avenir',
  },
  resetButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
  },
});

export default MemoryNumbersGame;
