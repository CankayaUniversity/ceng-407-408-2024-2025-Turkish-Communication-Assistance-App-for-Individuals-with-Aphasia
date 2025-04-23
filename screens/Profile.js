import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import firestore from '@react-native-firebase/firestore';

const Profile = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [caregiverData, setCaregiverData] = useState(null);
  // Orijinal kodda tek hasta verisi alınıyor (limit(1)), bu mantığı koruyoruz:
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (!id) {
          console.error('User ID not found');
          return;
        }
        setUserId(id);

        const userDoc = await firestore().collection('users').doc(id).get();
        if (!userDoc.exists) return;

        const data = userDoc.data();
        setUserData(data);

        // Hasta ise: Bakıcının bilgilerini al
        if (data.status === 'Hasta') {
          const caregiverId = data.caregiverId;
          if (caregiverId) {
            const caregiverDoc = await firestore().collection('users').doc(caregiverId).get();
            if (caregiverDoc.exists) {
              setCaregiverData(caregiverDoc.data());
            }
          }
        }
        // Bakıcı ise: ilişkili ilk hastayı getir (limit(1))
        else if (data.status === 'Bakıcı') {
          const patientQuery = await firestore()
            .collection('users')
            .where('caregiverId', '==', id)
            .limit(1)
            .get();
          if (!patientQuery.empty) {
            setPatientData(patientQuery.docs[0].data());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Çıkış sırasında hata:', error);
    }
  };

  // Profili ekrana basma fonksiyonu (mantık değişmedi)
  const renderProfileInfo = () => {
    if (!userData) return null;

    // Hasta girişi
    if (userData.status === 'Hasta') {
      return (
        <View style={styles.profileContainer}>
          <Text style={styles.profileTitle}>Hasta Profili</Text>
          <Text style={styles.profileText}>Hasta Adı: {userData.name}</Text>
          <Text style={styles.profileText}>Hasta Yaşı: {userData.age}</Text>
          <Text style={styles.profileText}>Hasta Email: {userData.email}</Text>
          <Text style={styles.profileText}>
            Bakıcı Adı: {caregiverData ? caregiverData.name : 'Yükleniyor...'}
          </Text>
          <Text style={styles.profileText}>
            Bakıcı Yaşı: {caregiverData ? caregiverData.age : 'Yükleniyor...'}
          </Text>
          <Text style={styles.profileText}>
            Bakıcı Email: {caregiverData ? caregiverData.email : 'Yükleniyor...'}
          </Text>
        </View>
      );
    }
    // Bakıcı girişi
    else if (userData.status === 'Bakıcı') {
      return (
        <View style={styles.profileContainer}>
          <Text style={styles.profileTitle}>Bakıcı Profili</Text>
          <Text style={styles.profileText}>Bakıcı Adı: {userData.name}</Text>
          <Text style={styles.profileText}>Bakıcı Yaşı: {userData.age}</Text>
          <Text style={styles.profileText}>Bakıcı Email: {userData.email}</Text>
          <Text style={styles.profileText}>
            Hasta Adı: {patientData ? patientData.name : 'Yükleniyor...'}
          </Text>
          <Text style={styles.profileText}>
            Hasta Yaşı: {patientData ? patientData.age : 'Yükleniyor...'}
          </Text>
          <Text style={styles.profileText}>
            Hasta Email: {patientData ? patientData.email : 'Yükleniyor...'}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Profil İkonu (Sayfanın üst kısmında) */}
      <View style={styles.iconContainer}>
        <Icon name="user-circle" size={100} color="#9B59B6" />
      </View>

      {/* Profil İçeriği (hastanın veya bakıcının bilgileri) */}
      {renderProfileInfo()}

      {/* Çıkış Yap Butonu (Altta sabit) */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="sign-out-alt" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
};

// Stil Ayarları
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F5FF', // Benzer pastel arka plan
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    // Gölge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Avenir',
    color: '#333',
    textAlign: 'center',
  },
  profileText: {
    fontSize: 16,
    marginVertical: 2,
    fontFamily: 'Avenir',
    color: '#555',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63', // neon pembe
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
});

export default Profile;
