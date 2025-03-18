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
        <Icon name="puzzle-piece" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Eşleştirme Egzersizi</Text>
      </TouchableOpacity>

      {/* Refleks Egzersizi */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('BalloonGame')}
      >
        <Icon name="bolt" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Refleks Egzersizi</Text>
      </TouchableOpacity>

      {/* Hafıza Egzersizi */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('MemoryGame')}
      >
        <Icon name="brain" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Hafıza Egzersizi</Text>
      </TouchableOpacity>

      {/* Çıkış Yap Butonu */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="sign-out-alt" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    fontFamily: 'Avenir',
  },
  button: {
    flexDirection: 'row', // İkon ve metni yan yana hizala
    alignItems: 'center',
    backgroundColor: '#4C6DAFFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
    marginLeft: 10, // İkon ve metin arasındaki boşluk
  },
  icon: {
    marginRight: 10, // Metin ile ikon arasındaki boşluk
  },
  logoutButton: {
    flexDirection: 'row', // İkon ve metni yan yana hizala
    alignItems: 'center',
    position: 'absolute',
    bottom: 20, // Ekranın en altına sabitle
    backgroundColor: '#FF5252',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '80%',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
    marginLeft: 10, // İkon ve metin arasındaki boşluk
  },
});

export default Exercise;
