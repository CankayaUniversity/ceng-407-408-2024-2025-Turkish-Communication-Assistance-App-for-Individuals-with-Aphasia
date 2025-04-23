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
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import storage from '@react-native-firebase/storage';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';


const { width } = Dimensions.get('window');

// Renk Paleti
const pastelPink  = "#FCE4EC";
const lightPink   = "#F8BBD0";
const neonPurple  = "#9B59B6";
const neonPink    = "#E91E63";
const white       = "#FFFFFF";

const audioRecorderPlayer = new AudioRecorderPlayer();

const Home = () => {
  // Genel state'ler
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [caregiverId, setCaregiverId] = useState(null); // Bakıcı ID'si
  
  // Modal görünürlükleri
  const [existingRoutinesModalVisible, setExistingRoutinesModalVisible] = useState(false);
  const [addRoutineModalVisible, setAddRoutineModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // Hasta ekleme modalı

  // Yeni rutin ekleme ile ilgili state'ler
  const [newRoutine, setNewRoutine] = useState('');
  const [options, setOptions] = useState(['']);
  const [selectedImage, setSelectedImage] = useState(null);
  const [helpMessage, setHelpMessage] = useState(false);

  // Ses Kaydı İşlemleri (Yeni Rutin Modalı için)
  const [recording, setRecording] = useState(false);
  const [audioFile, setAudioFile] = useState('');

  // Mevcut Rutinler
  const [routines, setRoutines] = useState([]);

  // Hasta ekleme için
  const [patientEmail, setPatientEmail] = useState('');

  // Hasta Rolünde Bakıcı Adı
  const [caregiverName, setCaregiverName] = useState('');

  // Varsayılan Rutinler (Home ekranı) - Sadece Egzersiz, İlaç, Su, Uyku
  const [defaultRoutines, setDefaultRoutines] = useState([
    'Egzersiz',
    'İlaç',
    'Su',
    'Uyku',
  ]);
  const [selectedRoutines, setSelectedRoutines] = useState([]);
  
  const [selectedOption, setSelectedOption] = useState(null);

  // **Modal için seçilen rutin** (artık expandedRoutineId yerine bu rutini tutacağız)
  const [modalRoutine, setModalRoutine] = useState(null);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);

  // Edit Modali İçin State'ler
  const [editRoutineModalVisible, setEditRoutineModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editOptions, setEditOptions] = useState(['']);
  const [editImage, setEditImage] = useState(null);
  const [editAudioText, setEditAudioText] = useState('');
  const [showEditAudioInput, setShowEditAudioInput] = useState(false);

  // Kullanıcı bilgilerini çek
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
            setCaregiverId(userData.caregiverId);
            fetchCaregiverName(userData.caregiverId);
            fetchRoutinesForPatient(id);
          }
        }
      } catch (error) {
        console.error('Veriler yüklenirken hata oluştu:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (helpMessage === true && role === "Bakıcı") {
    fetchPatients(userId);
    }
    setHelpMessage(false);
  },[helpMessage]) 

  useEffect(() => {
    if (editingRoutine) {
      setEditAudioText(editingRoutine.audio || '');
    }
  }, [editingRoutine]);

  // Bakıcının hastalarını getir
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

  // Hasta kendi rutinlerini getir (Hasta rolü)
  const fetchRoutinesForPatient = (patientId) => {
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

  // Seçilen hastanın rutinlerini getir (Bakıcı)
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

  // Hasta ekleme
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

  // Bakıcının ismini getir
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

  // Yeni rutin ekleme
  const handleAddRoutine = async () => {
    if (!newRoutine.trim()) {
      Alert.alert('Hata', 'Rutin adı boş olamaz.');
      return;
    }
    try {
      if (!selectedPatient) {
        Alert.alert('Hata', 'Lütfen bir hasta seçin.');
        return;
      }
      await firestore()
        .collection('users')
        .doc(selectedPatient.id)
        .collection('routines')
        .add({
          name: newRoutine,
          options: options,
          image: selectedImage || '',
          audio: audioFile || '',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      Alert.alert('Başarılı', 'Rutin başarıyla eklendi.');
      setNewRoutine('');
      setOptions([]);
      setOptions(['']);
      setSelectedImage(null);
      setAudioFile('');
      setAddRoutineModalVisible(false);
    } catch (error) {
      setOptions([]);
      setNewRoutine('');
      setOptions(['']);
      setSelectedImage(null);
      setAudioFile('');
      console.error('Rutin ekleme hatası:', error);
    }
  };

  const closeAddRoutineModal = () => {
    setOptions([]);
    setAddRoutineModalVisible(false);
    setNewRoutine('');
    setOptions(['']);
    setSelectedImage(null);
    setAudioFile('');
  }

  // Fotoğraf seçme (yeni rutin)
  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8, // %80 kalite, dosya boyutunu küçültür
      });
      console.log('Fotoğraf seçme sonucu:', result);
      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        console.log('Seçilen fotoğraf URI:', result.assets[0].uri);
      }
    } catch (error) {
      console.log('Fotoğraf seçme hatası:', error);
    }
  };

  const resolveEmergency = (patientId) => {
    Alert.alert(
      "Acil Durum",
      "Acil durum tamamlandı mı?",
      [
        { text: "Hayır", style: "cancel" },
        {
          text: "Evet",
          onPress: async () => {
            try {
              await firestore()
                .collection('users')
                .doc(patientId)
                .update({ helpRequest: false });
              Alert.alert("Bilgi", "Acil durum güncellendi.");
            } catch (error) {
              console.error("Acil durum güncelleme hatası:", error);
              Alert.alert("Hata", "Acil durum güncellenemedi.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  

  // Şık ekleme, silme, değiştirme (yeni rutin)
  const handleAddOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index + 1, 0, '');
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    if (options.length === 1) return;
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionChange = (text, index) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  // Rutin silme
  const handleDeleteRoutine = async (routineId) => {
    if (!selectedPatient) return;
    try {
      await firestore()
        .collection('users')
        .doc(selectedPatient.id)
        .collection('routines')
        .doc(routineId)
        .delete();
      Alert.alert('Başarılı', 'Rutin silindi.');
    } catch (error) {
      console.error('Rutin silme hatası:', error);
      Alert.alert('Hata', 'Rutin silinirken bir hata oluştu.');
    }
  };

  // Kayıt ayarlarını belirleyin. Örneğin, Android için:
  const recordingOptions = Platform.select({
    ios: {
      AVEncoderAudioQualityKeyIOS: 0, // düşük kalite
      AVNumberOfChannelsKeyIOS: 1,    // mono kaydı
      // AVFormatIDKeyIOS: 'kAudioFormatMPEG4AAC', // Bu satırı kaldırın ya da aşağıdaki gibi değiştirin
    },
    android: {
      AudioSourceAndroid: 6,
      AudioEncoderAndroid: "AAC",
      AudioEncodingBitRateAndroid: 32000,
      AudioSamplingRateAndroid: 8000,
    },
  });
  

  // --- Ses Kaydı İşlemleri (Yeni Rutin Modalı) ---
  const onStartRecord = async () => {
    try {
      console.log('Kayda başlamadan önce...');
      const result = await audioRecorderPlayer.startRecorder(undefined, recordingOptions);;
      setRecording(true);
      console.log('Kayda Başlandı:', result);
    } catch (error) {
      console.log('Kayda Başlama Hatası:', error);
    }
  };

  const onStopRecord = async () => {
    try {
      console.log('Kaydı durdurmayı deniyorum...');
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      console.log('Kayıt Durduruldu, dosya yolu:', result);
      
      const audioUrlCloudinary = await uploadAudioToCloudinary(result);
      setAudioFile(audioUrlCloudinary);
    } catch (error) {
      console.log('Kaydı Durdurma Hatası:', error);
    }
  };
  const onStartEditRecord = async () => {
    try {
      const result = await audioRecorderPlayer.startRecorder(undefined, recordingOptions);
      setRecording(true);
      console.log('Edit kayda başlandı:', result);
    } catch (error) {
      console.log('Edit kayda başlama hatası:', error);
    }
  };
  
  const onStopEditRecord = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      console.log('Edit kaydı durduruldu, path:', result);
      const url = await uploadAudioToCloudinary(result);
      console.log('Edit sonrası ses URL:', url);
      setEditAudioText(url);
    } catch (error) {
      console.log('Edit kaydı durdurma hatası:', error);
    }
  };
  
  const uploadAudioToCloudinary = async (fileUri) => {
    try {
      // FormData oluşturuyoruz
      const data = new FormData();
      data.append('file', {
        uri: fileUri,
        type: 'audio/m4a',          // Ses formatınız farklıysa örneğin 'audio/mp3' ayarlayın
        name: 'recording.m4a',
      });
      data.append('upload_preset', 'ml_default');  // Cloudinary upload preset
      data.append('api_key', '255596771261744');                // Cloudinary API key
  
      // Cloudinary API URL'si (YOUR_CLOUD_NAME yerine kendi cloud name’inizi yazın)
      const response = await fetch(`https://api.cloudinary.com/v1_1/dwomwxjjx/upload`, {
        method: 'POST',
        body: data,
      });
  
      const result = await response.json();
      if (result.secure_url) {
        console.log('Dosya başarılı şekilde yüklendi:', result.secure_url);
        return result.secure_url;
      } else {
        console.error('Cloudinary yükleme hatası:', result);
        return null;
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return null;
    }
  };

  const closePatientRoutineModal=()=>{
    setRoutineModalVisible(false);
    audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
    setModalRoutine(null);
  }
  
  // Edit modali verilerini doldur
  useEffect(() => {
    if (editingRoutine) {
      setEditRoutineName(editingRoutine.name);
      setEditOptions(editingRoutine.options || ['']);
      setEditImage(editingRoutine.image || null);
      setEditAudioText(editingRoutine.audio || '');
    }
  }, [editingRoutine]);

  const handlePickEditImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      });
      console.log('Edit - Fotoğraf seçme sonucu:', result);
      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setEditImage(result.assets[0].uri);
        console.log('Edit - Seçilen fotoğraf URI:', result.assets[0].uri);
      }
    } catch (error) {
      console.log("Edit Fotoğraf Seçme Hatası:", error);
    }
  };

  const handleAddEditOption = (index) => {
    const newOpts = [...editOptions];
    newOpts.splice(index + 1, 0, '');
    setEditOptions(newOpts);
  };

  const handleRemoveEditOption = (index) => {
    if (editOptions.length === 1) return;
    const newOpts = [...editOptions];
    newOpts.splice(index, 1);
    setEditOptions(newOpts);
  };

  const handleEditOptionChange = (text, index) => {
    const newOpts = [...editOptions];
    newOpts[index] = text;
    setEditOptions(newOpts);
  };

  const handleSaveEditedRoutine = async () => {
    if (!editRoutineName.trim()) {
      Alert.alert("Hata", "Rutin adı boş olamaz.");
      return;
    }
    try {
      await firestore()
        .collection('users')
        .doc(selectedPatient.id)
        .collection('routines')
        .doc(editingRoutine.id)
        .update({
          name: editRoutineName,
          options: editOptions,
          image: editImage || '',
          audio: editAudioText || '',
        });
      Alert.alert("Başarılı", "Rutin güncellendi.");
      setEditRoutineModalVisible(false);
      setEditingRoutine(null);
      setExistingRoutinesModalVisible(true);
    } catch (error) {
      console.error("Rutin Güncelleme Hatası:", error);
      Alert.alert("Hata", "Rutin güncellenirken bir hata oluştu.");
    }
  };


  const playAudioFromURL = async (audioUrl) => {
    try {
      if (!audioUrl) {
        console.log('Oynatılacak ses URL\'si boş.');
        return;
      }
      console.log('Ses oynatılıyor:', audioUrl);
      await audioRecorderPlayer.startPlayer(audioUrl);
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.current_position >= e.duration) {
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
          console.log('Ses oynatma tamamlandı.');
        }
        return;
      });
    } catch (error) {
      console.error('Ses oynatma hatası:', error);
    }
  };
  

  // Yardım Butonu (Hasta rolü) - caregiver dokümanında "helpRequest" alanını güncelle
  const sendHelpRequest = async () => {
    if (!caregiverId) {
      Alert.alert("Hata", "Bakıcı bilgisi bulunamadı.");
      return;
    }
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          helpRequest: true,
          helpTimestamp: firestore.FieldValue.serverTimestamp(),
        });
        setHelpMessage(true);
      Alert.alert("Gönderildi", "Yardım isteğiniz iletildi.");
    } catch (error) {
      console.error("Yardım isteği gönderilemedi:", error);
      Alert.alert("Hata", "Yardım isteği gönderilemedi.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Merhaba, {userName}! 👋🏻</Text>
          {role === 'Hasta' && (
            <Text style={styles.subtitle}>
              Bakıcınız: {caregiverName || 'Belirtilmemiş'} 🏥
            </Text>
          )}
        </View>
        {/* Hasta ise Yardım Butonu */}
        {role === 'Hasta' && (
          <TouchableOpacity style={styles.helpButton} onPress={sendHelpRequest}>
            <Icon name="exclamation-triangle" size={24} color={white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Hasta Rolü: Rutinleriniz */}
      {role === 'Hasta' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rutinleriniz</Text>
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
              data={routines}
              keyExtractor={(item) => item.id}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.routineSquare}
                  onPress={() => {
                    // Rutin'e tıklandığında modal aç
                    setModalRoutine(item);
                    setSelectedOption(null);
                    setRoutineModalVisible(true);
                    playAudioFromURL(item.audio);
                  }}
                >
                  <View style={styles.routineContent}>
                    <View style={styles.routineNameContainer}>
                      <Text style={styles.routineNameText}>{item.name}</Text>
                    </View>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.routineImage} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.noRoutinesText}>Henüz bir rutin eklenmemiş.</Text>
          )}

          {/* Varsayılan Rutinler */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Varsayılan Rutinler</Text>
          </View>
          <FlatList
            data={defaultRoutines}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.defaultRoutineCard,
                  selectedRoutines.includes(item) && { backgroundColor: '#4CAF50' },
                ]}
                onPress={() => {
                  if (selectedRoutines.includes(item)) {
                    setSelectedRoutines(selectedRoutines.filter((routine) => routine !== item));
                  } else {
                    setSelectedRoutines([...selectedRoutines, item]);
                  }
                }}
              >
                <Text
                  style={[
                    styles.defaultRoutineText,
                    selectedRoutines.includes(item) && { color: white },
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

      {/* Bakıcı Rolü: Hastalar */}
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
                <View style={styles.patientInfoContainer}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  {item.helpRequest === true && (
            <TouchableOpacity onPress={() => resolveEmergency(item.id)}>
              <Text style={{ color: 'red', marginLeft: 5, fontWeight: 'bold' }}>
                ! ACİL DURUM ÇAĞRISI !
              </Text>
            </TouchableOpacity>
          )}
                  <Text style={styles.patientDetails}>{item.email}</Text>
                </View>
                <View style={styles.patientButtonsContainer}>
                  <TouchableOpacity
                    style={styles.existingRoutinesBtn}
                    onPress={() => {
                      setSelectedPatient(item);
                      fetchRoutines(item.id);
                      setExistingRoutinesModalVisible(true);
                    }}
                  >
                    <Text style={styles.existingRoutinesBtnText}>
                      <Text style={styles.emojiText}>📋 </Text>
                      Mevcut Rutinler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addRoutineBtn}
                    onPress={() => {
                      setSelectedPatient(item);
                      setAddRoutineModalVisible(true);
                    }}
                  >
                    <Text style={styles.addRoutineBtnText}>
                      Yeni Rutin Ekle <Text style={styles.emojiText}>➕</Text>
                    </Text>
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
                                  .update({ caregiverId: null });
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

      {/* Hasta Ekle Modal (Bakıcı) */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Icon name="user-plus" size={40} color={neonPurple} style={styles.icon} />
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

      {/* Mevcut Rutinler Modal (Bakıcı) */}
      <Modal visible={existingRoutinesModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Icon name="tasks" size={40} color={neonPurple} style={styles.icon} />
            <Text style={styles.modalTitle}>
              {selectedPatient ? `${selectedPatient.name}'ın Mevcut Rutinleri` : ''}
            </Text>
            {routines.length > 0 ? (
              <FlatList
                data={routines}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.routineListRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setExistingRoutinesModalVisible(false);
                        setEditingRoutine(item);
                        setEditRoutineModalVisible(true);
                      }}
                      style={{ flex: 1 }}
                    >
                      <Text style={styles.routineListName}>{item.name}</Text>
                    </TouchableOpacity>
                    <View style={styles.iconContainer}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          setExistingRoutinesModalVisible(false);
                          setEditingRoutine(item);
                          setEditRoutineModalVisible(true);
                        }}
                      >
                        <Icon name="edit" size={18} color={neonPurple} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteRoutine(item.id)}
                      >
                        <Icon name="trash" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.noRoutinesText}>Bu hastanın henüz bir rutini yok.</Text>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setExistingRoutinesModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Yeni Rutin Ekle Modal (Bakıcı) */}
      <Modal visible={addRoutineModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Icon name="plus" size={40} color={neonPurple} style={styles.icon} />
            <Text style={styles.modalTitle}>
              {selectedPatient ? `${selectedPatient.name} için Yeni Rutin` : 'Yeni Rutin'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Yeni rutin adı"
              value={newRoutine}
              onChangeText={setNewRoutine}
            />
            {/* Fotoğraf ve Ses Kaydı Satırı */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.modalButton, { flex: 1 }]}
                onPress={handlePickImage}
              >
                <Text style={styles.modalButtonText}>Fotoğraf Seç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { flex: 1, marginLeft: 10 }]}
                onPress={recording ? onStopRecord : onStartRecord}
              >
                <Text style={styles.modalButtonText}>
                  {recording ? "Kaydı Bitir" : "Ses Kaydı Başlat"}
                </Text>
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={{ width: 100, height: 100, marginVertical: 10 }}
              />
            )}
            {audioFile ? (
              <Text style={styles.audioSavedText}>Ses kaydedildi.</Text>
            ) : (
              <Text style={styles.audioSavedText}>Ses kaydı henüz mevcut değil.</Text>
            )}
            {options.map((option, index) => (
              <View style={styles.optionRow} key={index}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 5 }]}
                  placeholder={`Şık ${index + 1}`}
                  value={option}
                  onChangeText={(text) => handleOptionChange(text, index)}
                />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleAddOption(index)}
                >
                  <Icon name="plus" size={18} color="green" />
                </TouchableOpacity>
                {options.length > 1 && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleRemoveOption(index)}
                  >
                    <Icon name="minus" size={18} color="red" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <View style={styles.bottomButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { marginBottom: 0, width: '45%' }]}
                onPress={closeAddRoutineModal}
              >
                <Text style={styles.modalButtonText}>Kapat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { marginBottom: 0, width: '45%' }]}
                onPress={handleAddRoutine}
              >
                <Text style={styles.modalButtonText}>Rutin Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Routine Modal (Bakıcı) */}
      <Modal visible={editRoutineModalVisible} animationType="fade" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Rutin Düzenle</Text>

      {/* Rutin Adı */}
      <TextInput
        style={styles.input}
        placeholder="Rutin Adı"
        value={editRoutineName}
        onChangeText={setEditRoutineName}
      />

      {/* Fotoğraf Seç */}
      <TouchableOpacity style={styles.modalButton} onPress={handlePickEditImage}>
        <Text style={styles.modalButtonText}>Fotoğraf Seç</Text>
      </TouchableOpacity>
      {editImage && (
        <Image
          source={{ uri: editImage }}
          style={{ width: 100, height: 100, marginVertical: 10 }}
        />
      )}

      {/* Şıklar */}
      {editOptions.map((opt, idx) => (
        <View style={styles.optionRow} key={idx}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 5 }]}
            placeholder={`Şık ${idx + 1}`}
            value={opt}
            onChangeText={(t) => handleEditOptionChange(t, idx)}
          />
          <TouchableOpacity style={styles.iconButton} onPress={() => handleAddEditOption(idx)}>
            <Icon name="plus" size={18} color="green" />
          </TouchableOpacity>
          {editOptions.length > 1 && (
            <TouchableOpacity style={styles.iconButton} onPress={() => handleRemoveEditOption(idx)}>
              <Icon name="minus" size={18} color="red" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* --- SES EKLE / DİNLE / SİL BÖLÜMÜ --- */}
      <View style={{ marginVertical: 10 }}>
        {editAudioText ? (
          // Mevcut ses URL'i varsa:
          <>
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => playAudioFromURL(editAudioText)}
            >
              <Text style={styles.modalOptionText}>Sesi Dinle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOptionButton, { backgroundColor: '#FFCDD2' }]}
              onPress={() => setEditAudioText('')}
            >
              <Text style={[styles.modalOptionText, { color: '#C62828' }]}>
                Sesi Sil
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Ses yoksa veya silindiyse:
          <TouchableOpacity
            style={styles.modalButton}
            onPress={recording ? onStopEditRecord : onStartEditRecord}
          >
            <Text style={styles.modalButtonText}>
              {recording ? 'Kaydı Bitir' : 'Ses Kaydet'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {/* --- SES BÖLÜMÜ SONU --- */}

      {/* Kapat / Kaydet */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={[styles.modalCloseButton, { width: '45%' }]}
          onPress={() => {
            setEditRoutineModalVisible(false);
            setEditingRoutine(null);
            setExistingRoutinesModalVisible(true);
            audioRecorderPlayer.stopPlayer();
            audioRecorderPlayer.removePlayBackListener();
          }}
        >
          <Text style={styles.modalButtonText}>Kapat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, { width: '45%' }]}
          onPress={handleSaveEditedRoutine}
        >
          <Text style={styles.modalButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      {/* Hasta Rutin Modal (istediğiniz modal) */}
      <Modal visible={routineModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.routineModalContainer}>
            {/* Rutinin fotoğrafı (varsa) */}
            {modalRoutine?.image && (
              <Image
                source={{ uri: modalRoutine.image }}
                style={{ width: '100%', height: 200, resizeMode: 'cover', marginBottom: 10 }}
              />
            )}
            {/* Rutin adı */}
            <Text style={styles.modalRoutineName}>{modalRoutine?.name}</Text>
            {/* Şıklar */}
            {modalRoutine?.options && modalRoutine.options.map((opt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOptionButton,
                  selectedOption === opt && { backgroundColor: 'green' },
                ]}
                onPress={() => setSelectedOption(opt)}
              >
                <Text style={[styles.modalOptionText, selectedOption === opt && { color: white }]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
            {/* Ses varsa Dinle butonu */}
            {modalRoutine?.audio ? (
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => playAudioFromURL(modalRoutine.audio)}
              >
              <Text style={styles.modalOptionText}>Sesi Dinle</Text>
            </TouchableOpacity>
          ) : null}
            {/* Kapat butonu */}
            <TouchableOpacity
              style={styles.modalCloseButton2}
              onPress={closePatientRoutineModal}
            >
              <Text style={styles.modalButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Stiller (öncekilere ek olarak modalOption vs. ekledik)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#E8F4F5FF",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 20,
    backgroundColor: neonPurple,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
    color: white,
  },
  subtitle: {
    fontSize: 18,
    color: white,
    fontFamily: 'Avenir',
  },
  helpButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 30,
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
    color: "#38508EFF",
  },
  routineSquare: {
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: white,
    borderRadius: 10,
    margin: 5,
    overflow: 'hidden',
    alignItems: 'center',
  },
  routineContent: { flex: 1, width: '100%' },
  routineNameContainer: {
    width: '100%',
    backgroundColor: 'rgba(240,240,240,0.9)',
    paddingVertical: 4,
  },
  routineNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  routineImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
  },
  defaultRoutineList: {
    alignItems: 'center',
    marginVertical: 20,
  },
  defaultRoutineCard: {
    backgroundColor: white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.35,
    height: width * 0.35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 10,
  },
  defaultRoutineText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  noRoutinesText: {
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
    color: '#555',
  },
  // Rutin Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineModalContainer: {
    width: width * 0.9,
    backgroundColor: white,
    borderRadius: 15,
    padding: 20,
  },
  modalRoutineName: {
    fontSize: 20,
    fontWeight: '600',
    color: neonPurple,
    textAlign: 'center',
    marginBottom: 15,
  },
  modalOptionButton: {
    padding: 10,
    backgroundColor: '#eee',
    marginVertical: 5,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalCloseButton2: {
    backgroundColor: neonPink,
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },

  // Hasta Kartları
  patientCard: {
    width: '100%',
    backgroundColor: pastelPink,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  patientInfoContainer: { marginBottom: 10 },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: neonPurple,
    fontFamily: 'Avenir',
    flexWrap: 'wrap',
  },
  patientDetails: {
    fontSize: 14,
    color: neonPurple,
    fontFamily: 'Avenir',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  patientButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  existingRoutinesBtn: {
    backgroundColor: lightPink,
    padding: 10,
    borderRadius: 8,
    marginRight: 5,
  },
  existingRoutinesBtnText: {
    color: white,
    fontSize: 14,
    fontFamily: 'Avenir',
    fontWeight: 'bold',
  },
  addRoutineBtn: {
    backgroundColor: neonPurple,
    padding: 10,
    borderRadius: 8,
    marginRight: 5,
  },
  addRoutineBtnText: {
    color: white,
    fontSize: 14,
    fontFamily: 'Avenir',
    fontWeight: 'bold',
  },
  deleteButton1: {
    backgroundColor: '#FFE8E8',
    padding: 8,
    borderRadius: 8,
  },
  addPatientButton: {
    backgroundColor: neonPurple,
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  addPatientText: {
    color: white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Avenir',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: white,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  icon: { marginBottom: 20, alignSelf: 'center' },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 15,
    fontFamily: 'Avenir',
    color: neonPink,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconButton: {
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    padding: 8,
    marginRight: 5,
  },
  modalButton: {
    backgroundColor: neonPurple,
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
    marginBottom: 10,
  },
  modalButtonText: {
    color: white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Avenir',
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  routineListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    marginBottom: 5,
  },
  routineListName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
    fontWeight: '500',
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 'auto',
    marginRight: 10,
  },
  editButton: {
    backgroundColor: '#E8EAF6',
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FFCDD2',
    padding: 8,
    borderRadius: 8,
  },
  emojiText: {
    color: white,
    fontWeight: 'bold',
  },
  audioSavedText: {
    fontSize: 14,
    color: neonPurple,
    fontFamily: 'Avenir',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default Home;
