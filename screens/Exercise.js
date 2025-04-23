import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Exercise = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear(); // AsyncStorage temizle
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // Login ekranına yönlendir
      });
    } catch (error) {
      console.error('Çıkış sırasında hata:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Egzersiz Oyunları</Text>

      {/* Eşleştirme Egzersizi */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('MatchingGame')}
      >
        <Icon name="puzzle-piece" size={20} color={styles.icon.color} style={styles.icon} />
        <Text style={styles.buttonText}>Eşleştirme Egzersizi</Text>
      </TouchableOpacity>

      {/* Refleks Egzersizi */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('BalloonGame')}
      >
        <Icon name="bolt" size={20} color={styles.icon.color} style={styles.icon} />
        <Text style={styles.buttonText}>Refleks Egzersizi</Text>
      </TouchableOpacity>

      {/* Hafıza Egzersizi */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('MemoryGame')}
      >
        <Icon name="brain" size={20} color={styles.icon.color} style={styles.icon} />
        <Text style={styles.buttonText}>Hafıza Egzersizi</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Arka plan, önceki mesaj ekranıyla benzer
  container: {
    flex: 1,
    backgroundColor: '#E8F4F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Başlık (header) aynı boyut, renk, font, vb. (Mesaj Kategorisi Seçin ile aynı)
  header: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Avenir',
  },
  // Buton tasarımı (mor arka plan, beyaz metin)
  button: {
    flexDirection: 'row', // İkon ve metni yan yana hizala
    alignItems: 'center',
    backgroundColor: '#9B59B6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
    marginLeft: 10,
  },
  icon: {
    color: '#FFFFFF',
    marginRight: 10,
  },
});

export default Exercise;
