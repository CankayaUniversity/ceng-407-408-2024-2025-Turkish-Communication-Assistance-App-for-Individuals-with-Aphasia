import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const icons = ['🍎', '🍌', '🍇', '🍓', '🍒', '🥝', '🍍', '🥥'];

const MatchingGame = ({ navigation }) => {
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const shuffledCards = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        matched: false,
        flipped: false,
      }));
    setCards(shuffledCards);
  }, []);

  const handleCardPress = (card) => {
    if (card.matched || selectedCards.length === 2) return;

    const newSelectedCards = [...selectedCards, card];
    setSelectedCards(newSelectedCards);

    if (newSelectedCards.length === 2) {
      setMoves((prev) => prev + 1);
      if (newSelectedCards[0].icon === newSelectedCards[1].icon) {
        setMatchedCards((prev) => [...prev, newSelectedCards[0].id, newSelectedCards[1].id]);
        setSelectedCards([]);
      } else {
        setTimeout(() => setSelectedCards([]), 1000);
      }
    }
  };

  useEffect(() => {
    if (matchedCards.length === cards.length && cards.length > 0) {
      Alert.alert('Tebrikler!', `Oyunu ${moves} hamlede tamamladınız.`, [
        { text: 'Tekrar Oyna', onPress: resetGame },
      ]);
    }
  }, [matchedCards]);

  const resetGame = () => {
    setMatchedCards([]);
    setSelectedCards([]);
    setMoves(0);
    const shuffledCards = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        matched: false,
        flipped: false,
      }));
    setCards(shuffledCards);
  };

  const renderCard = ({ item }) => {
    const isFlipped = selectedCards.some((card) => card.id === item.id) || matchedCards.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, isFlipped && styles.flippedCard]}
        onPress={() => handleCardPress(item)}
        disabled={isFlipped}
      >
        <Text style={[styles.cardText, isFlipped && styles.flippedText]}>
          {isFlipped ? item.icon : '?'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>Eşleştirme Oyunu</Text>
      <Text style={styles.subText}>Hamle Sayısı: {moves}</Text>
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={4}
        contentContainerStyle={styles.cardsContainer}
      />
      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetButtonText}>Sıfırla</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  backButton: {
    position: 'absolute',
    top: '10%',
    left: 10,
    zIndex: 10,
    padding: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#333',
    fontFamily:'Avenir'

  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontFamily:'Avenir'
  },
  cardsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 60,
    height: 60,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4C6DAFFF',
    borderRadius: 8,
  },
  flippedCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4C6DAFFF',
  },
  cardText: {
    fontSize: 24,
    color: '#fff',
    fontFamily:'Avenir'

  },
  flippedText: {
    color: '#4C6DAFFF',
    fontFamily:'Avenir'

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
    fontFamily:'Avenir'

  },
});

export default MatchingGame;
