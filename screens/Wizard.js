// src/screens/Wizard.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,   // ← eklendi
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

const Wizard = ({ route }) => {
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [modalVisible, setModalVisible] = useState(true);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const navigation = useNavigation();

  const saveUserDetails = async () => {
    if (!name || !age || !gender) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await firestore().collection('users').doc(userId).set(
        {
          name,
          age: parseInt(age, 10),
          gender,
        },
        { merge: true }
      );
      Alert.alert('Başarılı', 'Bilgileriniz kaydedildi.');
      setModalVisible(false);
      setRoleModalVisible(true); // Rol seçimi modalını aç
    } catch (error) {
      console.error('Kullanıcı bilgilerini kaydederken hata oluştu:', error);
      Alert.alert('Hata', 'Bilgiler kaydedilirken bir sorun oluştu.');
    }
  };

  const saveUserRole = async (role) => {
    try {
      await firestore().collection('users').doc(userId).set(
        {
          status: role,
        },
        { merge: true }
      );
      Alert.alert('Başarılı', `Rolünüz (${role}) olarak kaydedildi.`);
      setRoleModalVisible(false);

      navigation.navigate('BottomTabs', {
        screen: 'Home',
        params: { userId },
      });
    } catch (error) {
      console.error('Rol kaydedilirken hata oluştu:', error);
      Alert.alert('Hata', 'Rol kaydedilirken bir sorun oluştu.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/background_login.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Kullanıcı Bilgileri Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              style={styles.modalOverlay}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalHeader}>Kullanıcı Bilgileri</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Adınızı girin"
                  placeholderTextColor="#888"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Yaşınızı girin"
                  placeholderTextColor="#888"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => {
                    setGender(gender === 'Erkek' ? 'Kadın' : 'Erkek');
                  }}
                >
                  <Text style={gender ? styles.textInput : styles.placeholderText}>
                    {gender || 'Cinsiyet Seçin'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={saveUserDetails}>
                  <Text style={styles.buttonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Rol Seçimi Modal */}
        <Modal
          visible={roleModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setRoleModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Rol Seçimi</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => saveUserRole('Hasta')}
              >
                <Text style={styles.buttonText}>Hasta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => saveUserRole('Bakıcı')}
              >
                <Text style={styles.buttonText}>Bakıcı</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
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
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: height / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // %90 opak beyaz
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
    fontFamily: 'Avenir',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    width: '100%',
    justifyContent: 'center',
    fontFamily: 'Avenir',
  },
  placeholderText: {
    color: '#888',
    fontFamily: 'Avenir',
  },
  textInput: {
    color: '#333',
    fontFamily: 'Avenir',
  },
  button: {
    backgroundColor: '#987cd3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
  },
});

export default Wizard;
