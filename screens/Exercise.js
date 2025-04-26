import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width, height } = Dimensions.get('window');

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
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.header}>Egzersiz Oyunları</Text>

        {/* Eşleştirme Egzersizi */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('MatchingGame')}
        >
          <Icon
            name="puzzle-piece"
            size={20}
            color="#fff"
            style={styles.icon}
          />
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
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Avenir',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8063D6',
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
    marginRight: 10,
  },
});

export default Exercise;