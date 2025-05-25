import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const Profile = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [caregiverData, setCaregiverData] = useState(null);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const id = await AsyncStorage.getItem('userId');
      if (!id) return;
      setUserId(id);

      const userDoc = await firestore().collection('users').doc(id).get();
      if (!userDoc.exists) return;
      const data = userDoc.data();
      setUserData(data);

      if (data.status === 'Hasta') {
        if (data.caregiverId) {
          const cDoc = await firestore().collection('users').doc(data.caregiverId).get();
          if (cDoc.exists) setCaregiverData(cDoc.data());
        }
      } else if (data.status === 'Bakıcı') {
        const pQuery = await firestore()
          .collection('users')
          .where('caregiverId', '==', id)
          .limit(1)
          .get();
        if (!pQuery.empty) setPatientData(pQuery.docs[0].data());
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderProfileInfo = () => {
    if (!userData) return null;

    if (userData.status === 'Hasta') {
      return (
        <View style={styles.profileContainer}>
          <Text style={styles.profileTitle}>Hasta Profili</Text>
          <Text style={styles.profileText}>Ad: {userData.name}</Text>
          <Text style={styles.profileText}>Yaş: {userData.age}</Text>
          <Text style={styles.profileText}>Email: {userData.email}</Text>
          <Text style={styles.profileText}>
            Bakıcı: {caregiverData ? caregiverData.name : 'Yükleniyor...'}
          </Text>
          <Text style={styles.profileText}>
            Bakıcı Yaşı: {caregiverData ? caregiverData.age : 'Yükleniyor...'}
          </Text>
          <Text style={styles.profileText}>
            Bakıcı Email: {caregiverData ? caregiverData.email : 'Yükleniyor...'}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.profileContainer}>
          <Text style={styles.profileTitle}>Bakıcı Profili</Text>
          <Text style={styles.profileText}>Ad: {userData.name}</Text>
          <Text style={styles.profileText}>Yaş: {userData.age}</Text>
          <Text style={styles.profileText}>Email: {userData.email}</Text>
          <Text style={styles.profileText}>
            Hasta: {patientData ? patientData.name : 'Yükleniyor...'}
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
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Üstteki profil ikonu */}
        <View style={styles.iconContainer}>
          {/* icon rengini purple yaptık */}
          <Icon name="user-circle" size={100} color="purple" />
        </View>

        {renderProfileInfo()}

        {/* Çıkış Yap */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="sign-out-alt" size={20} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
  },
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 20,
  },
  profileContainer: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Avenir',
    color: '#333',
  },
  profileText: {
    fontSize: 16,
    marginBottom: 6,
    fontFamily: 'Avenir',
    color: '#555',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'purple',
    width: '90%',
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
  },
});

export default Profile;