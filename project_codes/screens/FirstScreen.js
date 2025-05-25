// src/screens/FirstScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ImageBackground,      // eklendi
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FirstScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  const [modalVisible, setModalVisible] = useState(true);
  const [loading, setLoading] = useState(true);

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
    return (
      <View style={dynamicStyles(isTablet, width, height).loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background_login.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={dynamicStyles(isTablet, width, height).container}>
        {/* Logo ve “Apphasia” başlığı kaldırıldı */}

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={dynamicStyles(isTablet, width, height).modalOverlay}>
            <View style={dynamicStyles(isTablet, width, height).modalContent}>
              <Text style={dynamicStyles(isTablet, width, height).modalTitle}>
                Hoşgeldiniz!
              </Text>
              <Text style={dynamicStyles(isTablet, width, height).modalSubtitle}>
                Hasta Profili Oluşturarak Devam Ediniz.
              </Text>
              <TouchableOpacity
                style={dynamicStyles(isTablet, width, height).button}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('Login');
                }}
              >
                <Text style={dynamicStyles(isTablet, width, height).buttonText}>
                  Profil Oluştur
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const dynamicStyles = (isTablet, width, height) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: 'transparent',         // transparent, background_image görünsün
      paddingHorizontal: isTablet ? 40 : 20,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    modalContent: {
      height: isTablet ? height / 3 : height / 2,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',  // %60 opak beyaz
      borderTopLeftRadius: isTablet ? 80 : 100,
      borderTopRightRadius: isTablet ? 80 : 100,
      padding: isTablet ? 40 : 20,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: 'bold',
      fontFamily: 'Avenir',
      color: '#333',
      marginBottom: isTablet ? 10 : 8,
    },
    modalSubtitle: {
      fontSize: isTablet ? 22 : 18,
      fontFamily: 'Avenir',
      color: '#555',
      marginBottom: isTablet ? 30 : 20,
    },
    button: {
      backgroundColor: '#987cd3',
      padding: isTablet ? 20 : 15,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
      marginTop: isTablet ? 20 : 15,
    },
    buttonText: {
      color: '#fff',
      fontSize: isTablet ? 20 : 16,
      fontWeight: 'bold',
      fontFamily: 'Avenir',
    },
  });

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default FirstScreen;
