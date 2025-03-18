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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const { height } = Dimensions.get('window');

GoogleSignin.configure({
  webClientId: '650337371318-cfjr95q7hu6gq39po1o1pn2cggerrs3q.apps.googleusercontent.com',
  offlineAccess: true,
});

const Login = () => {
  const [modalVisible, setModalVisible] = useState(true);
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Ekranın aktif olup olmadığını kontrol eder

  useEffect(() => {
    // Eğer kullanıcı Wizard.js'e geçiş yaptıysa modalı kapalı tut
    if (!isFocused) {
      setModalVisible(false);
    }
  }, [isFocused]);

  const getUserFromFirestore = async (userId) => {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error('Firestore kullanıcı alınırken hata:', error);
      return null;
    }
  };

  const saveUserToFirestore = async (user) => {
    try {
      await firestore().collection('users').doc(user.id).set(user, { merge: true });
    } catch (error) {
      console.error('Firestore kullanıcı kaydedilirken hata:', error);
      Alert.alert('Hata', 'Kullanıcı verileri kaydedilemedi.');
    }
  };

  const onGoogleButtonPress = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
  
      // Yanıtı kontrol et
      console.log('Google Sign-In Response:', userInfo);
  
      // Kullanıcı bilgilerini çek
      const googleUser = {
        id: userInfo?.user?.id || userInfo?.data?.user?.id,
        name: userInfo?.user?.name || `${userInfo?.data?.user?.givenName || ''} ${userInfo?.data?.user?.familyName || ''}`.trim(),
        email: userInfo?.user?.email || userInfo?.data?.user?.email,
      };
  
      // Doğru veriler loglanıyor mu?
      console.log('Google User Info:', googleUser);
  
      if (!googleUser.id || !googleUser.email) {
        throw new Error('Google Sign-In başarısız: Kullanıcı ID veya email alınamadı');
      }
  
      // Firestore kullanıcı kontrolü ve kaydı
      const existingUser = await getUserFromFirestore(googleUser.id);
      if (!existingUser) {
        await saveUserToFirestore(googleUser);
      }
  
      await AsyncStorage.setItem('loginType', 'google');
      await AsyncStorage.setItem('userId', googleUser.id);
  
      navigation.navigate('Wizard', { userId: googleUser.id });
    } catch (error) {
      console.error('Google Sign-In Hatası:', error);
      Alert.alert('Hata', 'Giriş işlemi sırasında bir sorun oluştu.');
    }
  };
  
  

  const onAppleButtonPress = async () => {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { user: appleUserId, email, fullName } = appleAuthRequestResponse;
      if (!appleUserId) {
        throw new Error('Apple kimlik doğrulama başarısız: Geçerli bir kullanıcı ID alınamadı.');
      }

      let name = fullName
        ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
        : 'Anonim Kullanıcı';
      let emailToSave = email || 'Bilinmeyen Email';

      const existingUser = await getUserFromFirestore(appleUserId);
      if (!existingUser) {
        await saveUserToFirestore({
          id: appleUserId,
          name,
          email: emailToSave,
        });
      }

      await AsyncStorage.setItem('loginType', 'apple');
      await AsyncStorage.setItem('userId', appleUserId);

      setModalVisible(false);
      navigation.navigate('Wizard', { userId: appleUserId });
    } catch (error) {
      console.error('Apple Sign-In hatası:', error);
      Alert.alert('Giriş işlemi sırasında bir sorun oluştu.');
    }
  };

  

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
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
            <Text style={styles.logoText}>Giriş</Text>

            <TouchableOpacity style={styles.googleButton} onPress={onGoogleButtonPress}>
              <Icon name="google" size={24} color="#fff" style={styles.icon} />
              <Text style={styles.buttonText}>Google ile Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appleButton} onPress={onAppleButtonPress}>
              <Icon name="apple" size={24} color="#fff" style={styles.icon} />
              <Text style={styles.buttonText}>Apple ile Giriş Yap</Text>
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
    width: 300,
    height: 300,
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.0,1)',
  },
  modalContent: {
    height: height / 2,
    backgroundColor: '#E0E8F8FF',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    padding: 20,
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DB4437',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Avenir',
  },
  icon: {
    marginRight: 10,
  },
});

export default Login;
