import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FirstScreen = ({ navigation }) => {
  // Ekran boyutlarını alıyoruz
  const { width, height } = useWindowDimensions();

  // width >= 768 ise iPad (tablet) olarak kabul ediyoruz
  const isTablet = width >= 768;

  const [modalVisible, setModalVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  // Login durumunu kontrol eden effect
  useEffect(() => {
    const checkLoginStatus = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home', params: { userId } }],
        });
      } else {
        setLoading(false);
      }
    };
    checkLoginStatus();
  }, [navigation]);

  if (loading) {
    // Giriş durumu kontrol edilirken bir yükleme göstergesi
    return (
      <View style={dynamicStyles(isTablet, width, height).loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles(isTablet, width, height).container}>
      <Image
        source={require('../assets/logo.png')}
        style={dynamicStyles(isTablet, width, height).logo}
        resizeMode="contain"
      />
      <Text style={dynamicStyles(isTablet, width, height).logoText}>Apphasia</Text>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={dynamicStyles(isTablet, width, height).modalOverlay}>
          <View style={dynamicStyles(isTablet, width, height).modalContent}>
            <Text style={dynamicStyles(isTablet, width, height).logoText}>Hoşgeldiniz!</Text>
            <Text style={dynamicStyles(isTablet, width, height).modalTitle}>Hasta Profili Oluştur</Text>
            <TouchableOpacity
              style={dynamicStyles(isTablet, width, height).button}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={dynamicStyles(isTablet, width, height).buttonText}>Profil Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// “isTablet, width, height” parametreleri alarak stil oluşturan bir fonksiyon.
// iPad (tablet) için farklı boyutlar, fontlar tanımlıyoruz.
const dynamicStyles = (isTablet, width, height) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      // Tabletler için biraz ekstra iç boşluk verilebilir
      paddingHorizontal: isTablet ? 40 : 20,
    },
    logo: {
      // iPad'de logoyu biraz daha büyük gösterelim
      width: isTablet ? 400 : 300,
      height: isTablet ? 400 : 300,
    },
    logoText: {
      fontSize: isTablet ? 40 : 32,
      fontWeight: 'bold',
      marginBottom: isTablet ? 30 : 20,
      color: '#4C6DAFFF',
      fontFamily: 'Avenir',
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      // Arkadaki alanın yarı saydam görünmesi
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    modalContent: {
      // Telefonlarda ekranın yarısı, iPad'de 1/3’ü kadar bir alan kaplayabilir
      height: isTablet ? height / 3 : height / 2,
      backgroundColor: '#E0E8F8FF',
      borderTopLeftRadius: isTablet ? 80 : 100,
      borderTopRightRadius: isTablet ? 80 : 100,
      padding: isTablet ? 40 : 20,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: isTablet ? 28 : 24,
      marginBottom: isTablet ? 30 : 20,
      textAlign: 'center',
      fontWeight: 'bold',
      fontFamily: 'Avenir',
    },
    button: {
      backgroundColor: '#4C6DAFFF',
      padding: isTablet ? 20 : 15,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
      marginTop: isTablet ? 30 : 20,
    },
    buttonText: {
      color: '#fff',
      fontSize: isTablet ? 20 : 16,
      fontWeight: 'bold',
      fontFamily: 'Avenir',
    },
  });

export default FirstScreen;
