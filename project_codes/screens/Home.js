// src/screens/Home.js
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
  ImageBackground, // ← eklendi
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
  const [caregiverId, setCaregiverId] = useState(null);

  // Modal görünürlükleri
  const [existingRoutinesModalVisible, setExistingRoutinesModalVisible] = useState(false);
  const [addRoutineModalVisible, setAddRoutineModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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

  // Varsayılan Rutinler
  const [defaultRoutines] = useState(['Egzersiz🏋️‍♂️','İlaç       💊','Su          💧','Uyku    😴']);
  const [selectedRoutines, setSelectedRoutines] = useState([]);

  const [selectedOption, setSelectedOption] = useState(null);

  // Modal için seçilen rutin
  const [modalRoutine, setModalRoutine] = useState(null);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);

  // Edit modali
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
    if (helpMessage && role === "Bakıcı") {
      fetchPatients(userId);
    }
    setHelpMessage(false);
  }, [helpMessage]);

  useEffect(() => {
    if (editingRoutine) {
      setEditAudioText(editingRoutine.audio || '');
    }
  }, [editingRoutine]);

  const fetchPatients = (cid) => {
    firestore()
      .collection('users')
      .where('caregiverId','==',cid)
      .onSnapshot(snap => {
        setPatients(snap.docs.map(d=>({id:d.id,...d.data()})));
      });
  };

  const fetchRoutinesForPatient = pid => {
    firestore()
      .collection('users').doc(pid)
      .collection('routines')
      .onSnapshot(snap => {
        setRoutines(snap.docs.map(d=>({id:d.id,...d.data()})));
      });
  };

  const fetchRoutines = pid => {
    fetchRoutinesForPatient(pid);
  };

  const handleAddPatient = async () => {
    if (!patientEmail.trim()) {
      Alert.alert('Hata','E-posta boş olamaz.');
      return;
    }
    try {
      const qs = await firestore().collection('users')
        .where('email','==',patientEmail).get();
      if (!qs.empty) {
        const doc = qs.docs[0];
        if (doc.data().status!=='Hasta') {
          Alert.alert('Hata','Kullanıcı hasta değil.');
          return;
        }
        await firestore().collection('users').doc(doc.id)
          .update({caregiverId:userId});
        Alert.alert('Başarılı','Hasta eklendi.');
        setPatientEmail(''); setModalVisible(false);
      } else {
        Alert.alert('Hata','Hasta bulunamadı.');
      }
    } catch(e){
      console.error(e);
      Alert.alert('Hata','Bir sorun oluştu.');
    }
  };

  const fetchCaregiverName = async cid => {
    if (!cid) return;
    const doc = await firestore().collection('users').doc(cid).get();
    if (doc.exists) setCaregiverName(doc.data().name);
  };

  const handleAddRoutine = async () => {
    if (!newRoutine.trim()) {
      Alert.alert('Hata','Rutin adı boş.');
      return;
    }
    if (!selectedPatient) {
      Alert.alert('Hata','Hasta seçin.');
      return;
    }
    try {
      await firestore()
        .collection('users').doc(selectedPatient.id)
        .collection('routines')
        .add({
          name:newRoutine,
          options,
          image:selectedImage||'',
          audio:audioFile||'',
          createdAt:firestore.FieldValue.serverTimestamp()
        });
      Alert.alert('Başarılı','Rutin eklendi.');
      setNewRoutine('');
      setOptions(['']);
      setSelectedImage(null);
      setAudioFile('');
      setAddRoutineModalVisible(false);
    } catch(e){
      console.error(e);
      Alert.alert('Hata','Rutin eklenemedi.');
    }
  };

  const closeAddRoutineModal = () => {
    setNewRoutine('');
    setOptions(['']);
    setSelectedImage(null);
    setAudioFile('');
    setAddRoutineModalVisible(false);
  };

  const handlePickImage = async () => {
    try {
      const res = await launchImageLibrary({
        mediaType:'photo',
        selectionLimit:1,
        quality:0.8
      });
      if (!res.didCancel && res.assets?.length) {
        setSelectedImage(res.assets[0].uri);
      }
    } catch(e){
      console.error(e);
    }
  };

  const resolveEmergency = pid => {
    Alert.alert('Acil Durum','Tamamlandı mı?',[
      {text:'Hayır',style:'cancel'},
      {text:'Evet',onPress:async()=>{
        try {
          await firestore().collection('users').doc(pid)
            .update({helpRequest:false});
          Alert.alert('Bilgi','Acil durum güncellendi.');
        } catch(e){console.error(e);Alert.alert('Hata','Güncellenemedi.');}
      }}
    ]);
  };

  const handleAddOption = idx => {
    const arr = [...options];
    arr.splice(idx+1,0,'');
    setOptions(arr);
  };
  const handleRemoveOption = idx => {
    if (options.length>1) {
      const arr=[...options];
      arr.splice(idx,1);
      setOptions(arr);
    }
  };
  const handleOptionChange = (t,idx) => {
    const arr=[...options];
    arr[idx]=t;
    setOptions(arr);
  };

  const handleDeleteRoutine = async rid => {
    if (!selectedPatient) return;
    try {
      await firestore()
        .collection('users').doc(selectedPatient.id)
        .collection('routines').doc(rid).delete();
      Alert.alert('Başarılı','Rutin silindi.');
    } catch(e){console.error(e);Alert.alert('Hata','Silinemedi.');}
  };

  const recordingOptions = Platform.select({
    ios:{
      AVEncoderAudioQualityKeyIOS:0,
      AVNumberOfChannelsKeyIOS:1
    },
    android:{
      AudioSourceAndroid:6,
      AudioEncoderAndroid:'AAC',
      AudioEncodingBitRateAndroid:32000,
      AudioSamplingRateAndroid:8000
    }
  });

  const onStartRecord = async() => {
    try {
      await audioRecorderPlayer.startRecorder(undefined,recordingOptions);
      setRecording(true);
    } catch(e){console.error(e);}
  };
  const onStopRecord = async() => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      const url = await uploadAudioToCloudinary(result);
      setAudioFile(url);
    } catch(e){console.error(e);}
  };
  const onStartEditRecord = onStartRecord;
  const onStopEditRecord = async()=>{
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      const url = await uploadAudioToCloudinary(result);
      setEditAudioText(url);
    } catch(e){console.error(e);}
  };

  const uploadAudioToCloudinary = async uri=>{
    try {
      const data = new FormData();
      data.append('file',{uri,type:'audio/m4a',name:'rec.m4a'});
      data.append('upload_preset','ml_default');
      data.append('api_key','255596771261744');
      const res = await fetch('https://api.cloudinary.com/v1_1/dwomwxjjx/upload',{
        method:'POST',body:data
      });
      const json = await res.json();
      return json.secure_url||null;
    } catch(e){console.error(e);return null;}
  };

  const closePatientRoutineModal = () => {
    setRoutineModalVisible(false);
    audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
    setModalRoutine(null);
  };

  useEffect(()=>{
    if(editingRoutine){
      setEditRoutineName(editingRoutine.name);
      setEditOptions(editingRoutine.options||['']);
      setEditImage(editingRoutine.image||null);
      setEditAudioText(editingRoutine.audio||'');
    }
  },[editingRoutine]);

  const handlePickEditImage = async()=>{
    try {
      const res = await launchImageLibrary({mediaType:'photo',selectionLimit:1});
      if(!res.didCancel && res.assets?.length){
        setEditImage(res.assets[0].uri);
      }
    }catch(e){console.error(e);}
  };

  const handleAddEditOption = idx=>{
    const arr=[...editOptions];
    arr.splice(idx+1,0,'');
    setEditOptions(arr);
  };
  const handleRemoveEditOption = idx=>{
    if(editOptions.length>1){
      const arr=[...editOptions];
      arr.splice(idx,1);
      setEditOptions(arr);
    }
  };
  const handleEditOptionChange = (t,idx)=>{
    const arr=[...editOptions];
    arr[idx]=t;
    setEditOptions(arr);
  };

  const handleSaveEditedRoutine = async()=>{
    if(!editRoutineName.trim()){
      Alert.alert('Hata','Rutin adı boş.');
      return;
    }
    try {
      await firestore()
        .collection('users').doc(selectedPatient.id)
        .collection('routines').doc(editingRoutine.id)
        .update({
          name:editRoutineName,
          options:editOptions,
          image:editImage||'',
          audio:editAudioText||''
        });
      Alert.alert('Başarılı','Rutin güncellendi.');
      setEditRoutineModalVisible(false);
      setEditingRoutine(null);
      setExistingRoutinesModalVisible(true);
    }catch(e){
      console.error(e);Alert.alert('Hata','Güncellenemedi.');
    }
  };

  const playAudioFromURL = async url=>{
    if(!url)return;
    try{
      await audioRecorderPlayer.startPlayer(url);
      audioRecorderPlayer.addPlayBackListener(e=>{
        if(e.current_position>=e.duration){
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
        }
      });
    }catch(e){console.error(e);}
  };

  const sendHelpRequest = async()=>{
    if(!caregiverId){
      Alert.alert('Hata','Bakıcı yok.');
      return;
    }
    try{
      await firestore().collection('users').doc(userId)
        .update({helpRequest:true,helpTimestamp:firestore.FieldValue.serverTimestamp()});
      setHelpMessage(true);
      Alert.alert('Gönderildi','Yardım gönderildi.');
    }catch(e){console.error(e);Alert.alert('Hata','Gönderilemedi.');}
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Merhaba, {userName}! 👋🏻</Text>
            {role==='Hasta' && (
              <Text style={styles.subtitle}>
                Bakıcınız: {caregiverName||'Yok'} 
              </Text>
            )}
          </View>
          {role==='Hasta' && (
            <TouchableOpacity style={styles.helpButton} onPress={sendHelpRequest}>
              <Icon name="exclamation-triangle" size={24} color={white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Hasta Rolü */}
        {role==='Hasta' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rutinleriniz</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('tr-TR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
              </Text>
            </View>
            {routines.length>0?(
              <FlatList
                data={routines}
                keyExtractor={item=>item.id}
                numColumns={3}
                renderItem={({item})=>(
                  <TouchableOpacity
                    style={styles.routineSquare}
                    onPress={()=>{
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
                      {item.image && (
                        <Image source={{uri:item.image}} style={styles.routineImage} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            ):(
              <Text style={styles.noRoutinesText}>Henüz bir rutin yok.</Text>
            )}
             <View style={[styles.sectionHeader, { marginTop: 40 }]}>
              <Text style={styles.sectionTitle}>Varsayılan Rutinler</Text>
            </View>
            <FlatList
              data={defaultRoutines}
              keyExtractor={(_,i)=>i.toString()}
              numColumns={2}
              renderItem={({item})=>(
                <TouchableOpacity
                  style={[
                    styles.defaultRoutineCard,
                    selectedRoutines.includes(item)&&{backgroundColor:'#4CAF50'}
                  ]}
                  onPress={()=>{
                    setSelectedRoutines(prev=>
                      prev.includes(item)?prev.filter(r=>r!==item):[...prev,item]
                    );
                  }}
                >
                  <Text style={[
                    styles.defaultRoutineText,
                    selectedRoutines.includes(item)&&{color:white}
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.defaultRoutineList}
            />
          </>
        )}

        {/* Bakıcı Rolü */}
        {role==='Bakıcı' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hastalar</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('tr-TR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
              </Text>
            </View>
            <FlatList
              data={patients}
              keyExtractor={item=>item.id}
              renderItem={({item})=>(
                <View style={styles.patientCard}>
                  <View style={styles.patientInfoContainer}>
                    <Text style={styles.patientName}>{item.name}</Text>
                    {item.helpRequest && (
                      <TouchableOpacity onPress={()=>resolveEmergency(item.id)}>
                        <Text style={{color:'red',fontWeight:'bold'}}>! ACİL DURUM !</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.patientDetails}>{item.email}</Text>
                  </View>
                  <View style={styles.patientButtonsContainer}>
                    <TouchableOpacity
                      style={styles.existingRoutinesBtn}
                      onPress={()=>{
                        setSelectedPatient(item);
                        fetchRoutines(item.id);
                        setExistingRoutinesModalVisible(true);
                      }}
                    >
                      <Text style={styles.existingRoutinesBtnText}>
                        <Text style={styles.emojiText}>📋 </Text>Mevcut Rutinler
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addRoutineBtn}
                      onPress={()=>{
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
                      onPress={async()=>{
                        Alert.alert('Onay',`${item.name}?`,[
                          {text:'İptal',style:'cancel'},
                          {text:'Kaldır',style:'destructive',onPress:async()=>{
                            try{
                              await firestore().collection('users').doc(item.id)
                                .update({caregiverId:null});
                              Alert.alert('Başarılı','Kaldırıldı.');
                            }catch(e){console.error(e);Alert.alert('Hata');}
                          }}
                        ]);
                      }}
                    >
                      <Icon name="trash" size={20} color="#FF3B30"/>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity
              style={styles.addPatientButton}
              onPress={()=>setModalVisible(true)}
            >
              <Text style={styles.addPatientText}>Hasta Ekle +</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Hasta Ekle Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Icon name="user-plus" size={40} color={neonPurple} style={styles.icon}/>
              <Text style={styles.modalTitle}>Yeni Hasta Ekle</Text>
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                value={patientEmail}
                onChangeText={setPatientEmail}
              />
              <TouchableOpacity style={styles.modalButton} onPress={handleAddPatient}>
                <Text style={styles.modalButtonText}>Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={()=>setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Mevcut Rutinler Modal */}
        <Modal visible={existingRoutinesModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Icon name="tasks" size={40} color={neonPurple} style={styles.icon}/>
              <Text style={styles.modalTitle}>
                {selectedPatient?.name}'ın Rutinleri
              </Text>
              {routines.length>0?(
                <FlatList
                  data={routines}
                  keyExtractor={item=>item.id}
                  renderItem={({item})=>(
                    <View style={styles.routineListRow}>
                      <TouchableOpacity
                        style={{flex:1}}
                        onPress={()=>{
                          setExistingRoutinesModalVisible(false);
                          setEditingRoutine(item);
                          setEditRoutineModalVisible(true);
                        }}
                      >
                        <Text style={styles.routineListName}>{item.name}</Text>
                      </TouchableOpacity>
                      <View style={styles.iconContainer}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={()=>{
                            setExistingRoutinesModalVisible(false);
                            setEditingRoutine(item);
                            setEditRoutineModalVisible(true);
                          }}
                        >
                          <Icon name="edit" size={18} color={neonPurple}/>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={()=>handleDeleteRoutine(item.id)}
                        >
                          <Icon name="trash" size={18} color="#FF3B30"/>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              ):(
                <Text style={styles.noRoutinesText}>Rutin yok.</Text>
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={()=>setExistingRoutinesModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Yeni Rutin Ekle Modal */}
        <Modal visible={addRoutineModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Icon name="plus" size={40} color={neonPurple} style={styles.icon}/>
              <Text style={styles.modalTitle}>
                {selectedPatient?.name} İçin Yeni Rutin
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Rutin adı"
                value={newRoutine}
                onChangeText={setNewRoutine}
              />
              <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                <TouchableOpacity
                  style={[styles.modalButton,{flex:1}]}
                  onPress={handlePickImage}
                >
                  <Text style={styles.modalButtonText}>Fotoğraf Seç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton,{flex:1,marginLeft:10}]}
                  onPress={recording?onStopRecord:onStartRecord}
                >
                  <Text style={styles.modalButtonText}>
                    {recording?'Kaydı Bitir':'Ses Kaydet'}
                  </Text>
                </TouchableOpacity>
              </View>
              {selectedImage&&(
                <Image source={{uri:selectedImage}} style={{width:100,height:100,marginVertical:10}}/>
              )}
              <Text style={styles.audioSavedText}>
                {audioFile?'Ses kaydedildi.':'Ses kaydı yok.'}
              </Text>
              {options.map((opt,idx)=>(
                <View style={styles.optionRow} key={idx}>
                  <TextInput
                    style={[styles.input,{flex:1,marginRight:5}]}
                    placeholder={`Şık ${idx+1}`}
                    value={opt}
                    onChangeText={t=>handleOptionChange(t,idx)}
                  />
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={()=>handleAddOption(idx)}
                  >
                    <Icon name="plus" size={18} color="green"/>
                  </TouchableOpacity>
                  {options.length>1&&(
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={()=>handleRemoveOption(idx)}
                    >
                      <Icon name="minus" size={18} color="red"/>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <View style={styles.bottomButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalCloseButton,{width:'45%'}]}
                  onPress={closeAddRoutineModal}
                >
                  <Text style={styles.modalButtonText}>Kapat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton,{width:'45%'}]}
                  onPress={handleAddRoutine}
                >
                  <Text style={styles.modalButtonText}>Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Routine Modal */}
        <Modal visible={editRoutineModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Rutin Düzenle</Text>
              <TextInput
                style={styles.input}
                placeholder="Rutin adı"
                value={editRoutineName}
                onChangeText={setEditRoutineName}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handlePickEditImage}
              >
                <Text style={styles.modalButtonText}>Fotoğraf Seç</Text>
              </TouchableOpacity>
              {editImage&&(
                <Image source={{uri:editImage}} style={{width:100,height:100,marginVertical:10}}/>
              )}
              {editOptions.map((opt,idx)=>(
                <View style={styles.optionRow} key={idx}>
                  <TextInput
                    style={[styles.input,{flex:1,marginRight:5}]}
                    placeholder={`Şık ${idx+1}`}
                    value={opt}
                    onChangeText={t=>handleEditOptionChange(t,idx)}
                  />
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={()=>handleAddEditOption(idx)}
                  >
                    <Icon name="plus" size={18} color="green"/>
                  </TouchableOpacity>
                  {editOptions.length>1&&(
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={()=>handleRemoveEditOption(idx)}
                    >
                      <Icon name="minus" size={18} color="red"/>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <View style={{marginVertical:10}}>
                {editAudioText?(
                  <>
                    <TouchableOpacity
                      style={styles.modalOptionButton}
                      onPress={()=>playAudioFromURL(editAudioText)}
                    >
                      <Text style={styles.modalOptionText}>Sesi Dinle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalOptionButton,{backgroundColor:'#FFCDD2'}]}
                      onPress={()=>setEditAudioText('')}
                    >
                      <Text style={[styles.modalOptionText,{color:'#C62828'}]}>
                        Sesi Sil
                      </Text>
                    </TouchableOpacity>
                  </>
                ):(
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={recording?onStopEditRecord:onStartEditRecord}
                  >
                    <Text style={styles.modalButtonText}>
                      {recording?'Kaydı Bitir':'Ses Kaydet'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.bottomButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalCloseButton,{width:'45%'}]}
                  onPress={()=>{
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
                  style={[styles.modalButton,{width:'45%'}]}
                  onPress={handleSaveEditedRoutine}
                >
                  <Text style={styles.modalButtonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Hasta Rutin Modal */}
        <Modal visible={routineModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.routineModalContainer}>
              {modalRoutine?.image&&(
                <Image
                  source={{uri:modalRoutine.image}}
                  style={{width:'100%',height:200,resizeMode:'cover',marginBottom:10}}
                />
              )}
              <Text style={styles.modalRoutineName}>{modalRoutine?.name}</Text>
              {modalRoutine?.options?.map((opt,idx)=>(
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalOptionButton,
                    selectedOption===opt&&{backgroundColor:'green'}
                  ]}
                  onPress={()=>setSelectedOption(opt)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedOption===opt&&{color:white}
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              {modalRoutine?.audio&&(
                <TouchableOpacity
                  style={styles.modalOptionButton}
                  onPress={()=>playAudioFromURL(modalRoutine.audio)}
                >
                  <Text style={styles.modalOptionText}>Sesi Dinle</Text>
                </TouchableOpacity>
              )}
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
    padding: 20,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 20,
    backgroundColor: 'transparent',   // ← fully transparent now
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  title: {
    fontSize:26,
    fontWeight:'bold',
    fontFamily:'Avenir',
    color:'#ffffff',
  },
  subtitle: {
    fontSize:18,
    color:white,
    fontFamily:'Avenir',
  },
  helpButton: {
    backgroundColor:'purple',
    padding:10,
    borderRadius:30,
  },
  sectionHeader: {
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:10,
  },
  dateText: {
    fontSize:14,
    color:'#FFFFFF',
    fontFamily:'Avenir',
  },
  sectionTitle: {
    fontSize:22,
    fontWeight:'600',
    fontFamily:'Avenir',
    color:"#ffffff",
  },
  routineSquare: {
    width:width*0.3,
    height:width*0.3,
    backgroundColor:white,
    borderRadius:10,
    margin:5,
    overflow:'hidden',
    alignItems:'center',
  },
  routineContent:{flex:1,width:'100%'},
  routineNameContainer:{
    width:'100%',
    backgroundColor:'rgba(240,240,240,0.9)',
    paddingVertical:4,
  },
  routineNameText:{
    fontSize:14,
    fontWeight:'bold',
    color:'#333',
    textAlign:'center',
  },
  routineImage:{
    width:'100%',
    height:'70%',
    resizeMode:'cover',
  },
  defaultRoutineList:{
    alignItems:'center',
    marginTop:40,     // Varsayılan rutinleri aşağıya taşıdık
    marginBottom:20,  // Alttaki bar ile boşluk bıraktık
  },
  defaultRoutineCard:{
    backgroundColor:white,
    borderRadius:12,
    padding:16,               // Biraz daha kompakt iç boşluk
    alignItems:'center',
    justifyContent:'center',
    width:width*0.25,         // Kartları küçülttük
    height:width*0.25,
    shadowColor:'#000',
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.1,
    shadowRadius:4,
    elevation:2,
    margin:8,                 // Kartlar arası boşluğu da biraz azalttık
  },
  defaultRoutineText:{
    fontSize:14,
    fontWeight:'500',
    color:'#333',
    textAlign:'center',
  },
  noRoutinesText:{
    textAlign:'center',
    marginTop:10,
    fontStyle:'italic',
    color:'#555',
  },
  modalOverlay:{
    flex:1,
    backgroundColor:'rgba(0,0,0,0.3)',
    justifyContent:'center',
    alignItems:'center',
  },
  routineModalContainer:{
    width:width*0.9,
    backgroundColor:white,
    borderRadius:15,
    padding:20,
  },
  modalRoutineName:{
    fontSize:20,
    fontWeight:'600',
    color:neonPurple,
    textAlign:'center',
    marginBottom:15,
  },
  modalOptionButton:{
    padding:10,
    backgroundColor:'#eee',
    marginVertical:5,
    borderRadius:8,
  },
  modalOptionText:{
    fontSize:16,
    color:'#333',
    textAlign:'center',
  },
  modalCloseButton2:{
    backgroundColor:neonPink,
    padding:12,
    borderRadius:10,
    marginTop:15,
    alignItems:'center',
  },
  patientCard:{
    width:'100%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',  // %75 transparan beyaz    
    padding:15,
    borderRadius:12,
    marginBottom:10,
    shadowColor:'#000',
    shadowOffset:{width:0,height:1},
    shadowOpacity:0.1,
    shadowRadius:3,
    flexDirection:'column',
    justifyContent:'space-between',
  },
  patientInfoContainer:{marginBottom:10},
  patientName:{
    fontSize:18,
    fontWeight: 'bold',
    color: '#8063D6',         // beyaz
    fontFamily:'Avenir',
    flexWrap:'wrap',
  },
  patientDetails:{
    fontSize:14,
    fontWeight: 'bold',
    color: '#8063D6',         // beyaz    
    fontFamily:'Avenir',
    flexWrap:'wrap',
    marginTop:2,
  },
  patientButtonsContainer:{
    flexDirection:'row',
    justifyContent:'flex-end',
    alignItems:'center',
  },
  existingRoutinesBtn:{
    backgroundColor:'#b47fb5',
    padding:10,
    borderRadius:8,
    marginRight:5,
  },
  existingRoutinesBtnText:{
    color:white,
    fontSize:14,
    fontFamily:'Avenir',
    fontWeight:'bold',
  },
  addRoutineBtn:{
    backgroundColor:'#9a7cd1',
    padding:10,
    borderRadius:8,
    marginRight:5,
  },
  addRoutineBtnText:{
    color:white,
    fontSize:14,
    fontFamily:'Avenir',
    fontWeight:'bold',
  },
  deleteButton1:{
    backgroundColor:'#FFE8E8',
    padding:8,
    borderRadius:8,
  },
  addPatientButton: {
    backgroundColor: '#8063D6',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginHorizontal: 20,  // ← sağına ve soluna boşluk
    marginBottom: 20,      // ← altındaki bar ile biraz boşluk
  },
  addPatientText:{
    color:white,
    textAlign:'center',
    fontSize:16,
    fontWeight:'600',
    fontFamily:'Avenir',
  },
  modalContainer:{
    width:width*0.85,
    backgroundColor:white,
    borderRadius:15,
    padding:20,
    shadowColor:'#000',
    shadowOffset:{width:0,height:3},
    shadowOpacity:0.2,
    shadowRadius:5,
  },
  icon:{marginBottom:20,alignSelf:'center'},
  modalTitle:{
    fontSize:20,
    fontWeight:'500',
    marginBottom:15,
    fontFamily:'Avenir',
    color:neonPink,
    textAlign:'center',
  },
  input:{
    width:'100%',
    backgroundColor:'#F0F0F0',
    borderRadius:8,
    padding:15,
    marginBottom:15,
    fontSize:16,
    fontFamily:'Avenir',
  },
  optionRow:{
    flexDirection:'row',
    alignItems:'center',
    marginBottom:10,
  },
  iconButton:{
    backgroundColor:'#E8E8E8',
    borderRadius:8,
    padding:8,
    marginRight:5,
  },
  modalButton:{
    backgroundColor:neonPurple,
    paddingVertical:12,
    paddingHorizontal:20,
    borderRadius:10,
    width:'100%',
    marginBottom:10,
  },
  modalCloseButton:{
    backgroundColor:'#FF3B30',
    paddingVertical:12,
    paddingHorizontal:20,
    borderRadius:10,
    width:'100%',
    marginBottom:10,
  },
  modalButtonText:{
    color:white,
    textAlign:'center',
    fontSize:16,
    fontWeight:'600',
    fontFamily:'Avenir',
  },
  bottomButtonsContainer:{
    flexDirection:'row',
    justifyContent:'space-between',
    marginTop:10,
  },
  routineListRow:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#FFF',
    paddingVertical:8,
    marginBottom:5,
  },
  routineListName:{
    fontSize:16,
    color:'#333',
    marginLeft:5,
    fontWeight:'500',
  },
  iconContainer:{
    flexDirection:'row',
    gap:10,
    marginLeft:'auto',
    marginRight:10,
  },
  editButton:{
    backgroundColor:'#E8EAF6',
    padding:8,
    borderRadius:8,
  },
  deleteButton:{
    backgroundColor:'#FFCDD2',
    padding:8,
    borderRadius:8,
  },
  emojiText:{
    color:white,
    fontWeight:'bold',
  },
  audioSavedText:{
    fontSize:14,
    color:neonPurple,
    fontFamily:'Avenir',
    textAlign:'center',
    marginBottom:10,
  },
});

export default Home;
