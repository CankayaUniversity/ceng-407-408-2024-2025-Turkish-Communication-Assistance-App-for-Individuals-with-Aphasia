import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const Home = () => {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [newRoutine, setNewRoutine] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [routines, setRoutines] = useState([]);
  const [patientEmail, setPatientEmail] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [defaultRoutines, setDefaultRoutines] = useState([
    'Egzersiz',
    'Yemek',
    'İlaç',
    'Dinlenme',
    'Meditasyon',
    'Yürüyüş',
    'Su İçme',
    'Okuma',
    'Uyku',
  ]);
  
  const [selectedRoutines, setSelectedRoutines] = useState([]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (!id) {
          Alert.alert('Hata', 'Kullanıcı kimliği bulunamadı.');
          return;
        }
        setUserId(id);

        const userDoc = await firestore().collection('users').doc(id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setRole(userData.status);
          setUserName(userData.name);

          if (userData.status === 'Bakıcı') {
            fetchPatients(id);
          } else if (userData.status === 'Hasta') {
            fetchCaregiverName(userData.caregiverId);
            fetchRoutines(id);
          }
        }
      } catch (error) {
        console.error('Veriler yüklenirken hata oluştu:', error);
      }
    };

    fetchUserData();
  }, []);

  const fetchPatients = (caregiverId) => {
    firestore()
      .collection('users')
      .where('caregiverId', '==', caregiverId)
      .onSnapshot((snapshot) => {
        const fetchedPatients = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(fetchedPatients);
      });
  };

  const handleAddPatient = async () => {
    if (!patientEmail.trim()) {
      Alert.alert('Hata', 'E-posta adresi boş olamaz.');
      return;
    }
    try {
      const querySnapshot = await firestore()
        .collection('users')
        .where('email', '==', patientEmail)
        .get();
      if (!querySnapshot.empty) {
        const patientData = querySnapshot.docs[0].data();
        const patientId = querySnapshot.docs[0].id;

        if (patientData.status !== 'Hasta') {
          Alert.alert('Hata', 'Bu kullanıcı bir hasta değildir.');
          return;
        }

        await firestore().collection('users').doc(patientId).update({
          caregiverId: userId,
        });

        Alert.alert('Başarılı', 'Hasta başarıyla eklendi.');
        setPatientEmail('');
        setModalVisible(false);
      } else {
        Alert.alert('Hata', 'Böyle bir hasta bulunamadı.');
      }
    } catch (error) {
      console.error('Hasta ekleme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu.');
    }
  };

  const fetchCaregiverName = async (caregiverId) => {
    try {
      if (!caregiverId) return;
      const caregiverDoc = await firestore().collection('users').doc(caregiverId).get();
      if (caregiverDoc.exists) {
        setCaregiverName(caregiverDoc.data().name);
      }
    } catch (error) {
      console.error('Bakıcının ismi alınırken hata oluştu:', error);
    }
  };

  const fetchRoutines = (patientId) => {
    firestore()
      .collection('users')
      .doc(patientId)
      .collection('routines')
      .onSnapshot((snapshot) => {
        const fetchedRoutines = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRoutines(fetchedRoutines);
      });
  };

  const handleAddRoutine = async () => {
    if (!newRoutine.trim()) {
      Alert.alert('Hata', 'Rutin adı boş olamaz.');
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(selectedPatient.id)
        .collection('routines')
        .add({
          name: newRoutine,
          time: selectedTime.toISOString(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert('Başarılı', 'Rutin başarıyla eklendi.');
      setNewRoutine('');
      setSelectedTime(new Date());
      setRoutineModalVisible(false);
    } catch (error) {
      console.error('Rutin ekleme hatası:', error);
    }
  };

  const openRoutineModal = (patient) => {
    setSelectedPatient(patient);
    fetchRoutines(patient.id);
    setRoutineModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Merhaba, {userName}! 👋🏻</Text>
          {role === 'Hasta' && (
            <Text style={styles.subtitle}>Bakıcınız: {caregiverName || 'Belirtilmemiş'} 🏥</Text>
          )}
        </View>
      </View>

      {role === 'Hasta' && (
  <>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Rutinleriniz </Text>
      <Text style={styles.dateText}>
       📅 {new Date().toLocaleDateString('tr-TR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
    </View>
    {routines.length > 0 ? (
      <FlatList
        data={routines.sort((a, b) => new Date(a.time) - new Date(b.time))} // Saat sırasına göre sıralama
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.routineCard}>
            <Text style={styles.routineText}>📌 {item.name}</Text>
            <Text style={styles.routineTime}>
              {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ⏰
            </Text>
          </View>
        )}
      />
    ) : (
      <Text style={styles.noRoutinesText}>Henüz bir rutin eklenmemiş.</Text>
    )}

<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Varsayılan Rutinler</Text>
</View>
<FlatList
  data={defaultRoutines}
  keyExtractor={(item, index) => index.toString()}
  numColumns={3} // 3 sütunlu düzen
  renderItem={({ item }) => (
    <TouchableOpacity
      style={[
        styles.defaultRoutineCard,
        selectedRoutines.includes(item) && { backgroundColor: '#4CAF50' },
      ]}
      onPress={() => {
        if (selectedRoutines.includes(item)) {
          // Seçili olanı kaldır
          setSelectedRoutines(selectedRoutines.filter((routine) => routine !== item));
        } else {
          // Yeni seçimi ekle
          setSelectedRoutines([...selectedRoutines, item]);
        }
      }}
    >
      <Text
        style={[
          styles.defaultRoutineText,
          selectedRoutines.includes(item) && { color: '#fff' },
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  )}
  contentContainerStyle={styles.defaultRoutineList}
/>


  </>

  
)}


{role === 'Bakıcı' && (
  <>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Hastalar</Text>
      <Text style={styles.dateText}>
        📅 {new Date().toLocaleDateString('tr-TR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
    </View>
    <FlatList
      data={patients}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.patientCard}>
          <TouchableOpacity
            style={styles.patientInfo}
            onPress={() => openRoutineModal(item)}
          >
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientDetails}>{item.email}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton1}
            onPress={async () => {
              Alert.alert(
                'Onay',
                `${item.name} adlı hastayı kaldırmak istediğinize emin misiniz?`,
                [
                  { text: 'İptal', style: 'cancel' },
                  {
                    text: 'Kaldır',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await firestore()
                          .collection('users')
                          .doc(item.id)
                          .update({ caregiverId: null }); // Hastayı bakıcıdan kaldır
                        Alert.alert('Başarılı', 'Hasta başarıyla kaldırıldı.');
                      } catch (error) {
                        console.error('Hastayı kaldırırken hata:', error);
                        Alert.alert('Hata', 'Hastayı kaldırırken bir sorun oluştu.');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Icon name="trash" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    />
    <TouchableOpacity
      style={styles.addPatientButton}
      onPress={() => setModalVisible(true)}
    >
      <Text style={styles.addPatientText}>Hasta Ekle +</Text>
    </TouchableOpacity>
  </>
)}


      {/* Hasta Ekle Modalı */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Icon name="user-plus" size={40} color="#007AFF" style={styles.icon} />
            <Text style={styles.modalTitle}>Yeni Hasta Ekle</Text>
            <TextInput
              style={styles.input}
              placeholder="E-posta adresi"
              value={patientEmail}
              onChangeText={setPatientEmail}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAddPatient}>
              <Text style={styles.modalButtonText}>Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rutin Ekle Modalı */}
      <Modal visible={routineModalVisible} animationType="fade" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Icon name="tasks" size={40} color="#007AFF" style={styles.icon} />
      <Text style={styles.modalTitle}>
        {selectedPatient ? `${selectedPatient.name}'ın Rutinleri` : ''}
      </Text>

      {/* Hastanın rutinlerini listeleme */}
      {routines.length > 0 ? (
       <FlatList
       data={routines}
       keyExtractor={(item) => item.id}
       renderItem={({ item }) => (
         <View style={styles.routineCard}>
           <View style={{ flex: 1 }}>
             <Text style={styles.routineText}>{item.name}</Text>
             <Text style={styles.routineTime}>
               {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </Text>
           </View>
           <View style={styles.iconContainer}>
             <TouchableOpacity
               style={styles.editButton}
               onPress={() => {
                 setNewRoutine(item.name);
                 setSelectedTime(new Date(item.time));
                 setDatePickerVisible(true);
               }}
             >
               <Icon name="edit" size={18} color="#007AFF" />
             </TouchableOpacity>
             <TouchableOpacity
               style={styles.deleteButton}
               onPress={async () => {
                 await firestore()
                   .collection('users')
                   .doc(selectedPatient.id)
                   .collection('routines')
                   .doc(item.id)
                   .delete();
                 Alert.alert('Başarılı', 'Rutin silindi.');
               }}
             >
               <Icon name="trash" size={18} color="#FF3B30" />
             </TouchableOpacity>
           </View>
         </View>
       )}
     />
     
      ) : (
        <Text style={styles.noRoutinesText}>Henüz bir rutin eklenmemiş.</Text>
      )}

      {/* Yeni rutin ekleme */}
      <TextInput
        style={styles.input}
        placeholder="Yeni rutin adı"
        value={newRoutine}
        onChangeText={setNewRoutine}
      />
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setDatePickerVisible(true)}
      >
        <Text style={styles.timeButtonText}>
          Saat Seç: {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
      <DatePicker
        modal
        open={datePickerVisible}
        date={selectedTime}
        mode="time"
        onConfirm={(date) => {
          setDatePickerVisible(false);
          setSelectedTime(date);
        }}
        onCancel={() => setDatePickerVisible(false)}
      />
      <TouchableOpacity style={styles.modalButton} onPress={handleAddRoutine}>
        <Text style={styles.modalButtonText}>Rutin Ekle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.modalCloseButton}
        onPress={() => setRoutineModalVisible(false)}
      >
        <Text style={styles.modalButtonText}>Kapat</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#E8F4F5FF', margin:20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 20,
    backgroundColor: '#4C81AFFF',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  
  headerEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Avenir',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Avenir',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Avenir',
    color: '#38508EFF',
  },
  
  patientCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  patientName: { fontSize: 18, fontWeight: '500', color: '#38608EFF', fontFamily: 'Avenir' },
  patientDetails: { fontSize: 14, color: '#555', fontFamily: 'Avenir' },
  addPatientButton: {
    backgroundColor: '#388E3C',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  addPatientText: { color: '#FFFFFF', textAlign: 'center', fontSize: 16, fontWeight: '600', fontFamily: 'Avenir' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  icon: { marginBottom: 20 },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 15,
    fontFamily: 'Avenir',
    color: '#333',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Avenir',
  },
  timeButton: {
    backgroundColor: '#38488EFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  timeButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Avenir',
  },
  modalButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  modalCloseButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
  },
  modalButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Avenir',
  },
  routineCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  routineText: { fontSize: 16, color: '#333', fontFamily: 'Avenir' },
  routineTime: { fontSize: 14, color: '#555', fontFamily: 'Avenir' },
  noRoutinesText: { fontSize: 16, color: '#555', marginTop: 10, fontFamily: 'Avenir' },

  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // İkonların düzenlenme yönü
    alignItems: 'center',
    gap: 10, // İkonlar arasında boşluk bırakır (RN v0.71 ve üstü için)
    marginLeft: 10, // Kapsayıcı boşluğu artırır
  },
  editButton: {
    backgroundColor: '#E8F0FF',
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FFE8E8',
    padding: 8,
    borderRadius: 8,
  },

  patientInfo: {
    flex: 1,

  },
  deleteButton1: {
    marginLeft: '90%',
    backgroundColor: '#FFE8E8',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    width:'10%'
  },

  defaultRoutineList: {
    paddingHorizontal: 4,
    marginVertical: 10,
  },
  defaultRoutineCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.25, // Ekran genişliğinin %28'i
    height: width * 0.25, // Ekran genişliği ile aynı oran
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 5, // Kutucuklar arasındaki boşluk
  },
  defaultRoutineText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },


});

export default Home;
