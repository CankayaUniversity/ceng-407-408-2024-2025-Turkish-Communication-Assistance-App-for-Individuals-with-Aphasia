import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window'); // Ekran yüksekliğini alıyoruz

const FirstScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        // Eğer userId varsa doğrudan Home ekranına yönlendir
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home', params: { userId } }],
        });
      } else {
        // Eğer userId yoksa modal göster ve Login ekranına yönlendirme yapabilsin
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, [navigation]);

  if (loading) {
    // Giriş durumu kontrol edilirken bir yükleme göstergesi göster
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={require('../assets/logo.png')} // Logoyu assets klasöründen alıyoruz
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.logoText}>Apphasia</Text>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.logoText}>Hoşgeldiniz !</Text>

            <Text style={styles.modalTitle}>Hasta Profili Oluştur</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.buttonText}>Profil Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 300, // Logo genişliği
    height: 300, // Logo yüksekliği
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4C6DAFFF',
    fontFamily: 'Avenir',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Modalın alt kısımdan açılmasını sağlıyor
    backgroundColor: 'rgba(0, 0, 0, 0.0,1)', // Arkadaki alanın yarı saydam görünmesi için
  },
  modalContent: {
    height: height / 2, // Ekranın yarısını kaplayacak
    backgroundColor: '#E0E8F8FF',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'Avenir',
  },
  button: {
    backgroundColor: '#4C6DAFFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
  },
});

export default FirstScreen;
