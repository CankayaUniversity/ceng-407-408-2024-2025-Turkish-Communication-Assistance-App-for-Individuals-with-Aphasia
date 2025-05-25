// src/screens/NewTextScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Renk Paleti (mor, pembe tonları) ---
const pastelPink  = "#FCE4EC";    // Yumuşak pembe
const lightPink   = "#F8BBD0";    // Açık pembe
const neonPurple  = "#9B59B6";    // Neon mor (başlık, vurgular)
const neonPink    = "#E91E63";    // Neon pembe (ikinci vurgular)
const white       = "#FFFFFF";
const greyDark    = "#333";

// --- Hızlı Sohbet Mesajları ---
const quickMessagesList = [
  "👨‍👧‍👦 Baba",
  "👩‍👧‍👦 Anne",
  "🙏 Teşekkürler",
  "😊 Rica ederim",
  "🚫 Yapma",
  "⏰ Saat kaç?",
  "💊 İlacımı istiyorum",
];

// --------------------------------------------------
// "Temel Sözcükler" kategorileri
// --------------------------------------------------
const basicWordsCategories = [
  {
    title: "5N1K",
    data: [
      { text: "Ne?" },
      { text: "Nasıl?" },
      { text: "Ne Zaman?" },
      { text: "Nerede?" },
      { text: "Ne Kadar?" },
      { text: "Kim?" },
    ],
  },
  {
    title: "Özneler",
    data: [
      { text: "Ben", emoji: "🙂" },
      { text: "Sen", emoji: "😉" },
      { text: "O",   emoji: "😐" },
      { text: "Biz", emoji: "👫" },
      { text: "Siz", emoji: "👬" },
      { text: "Onlar", emoji: "👥" },
    ],
  },
  {
    title: "Fiiller",
    data: [
      { text: "Al", emoji: "🤲" },
      { text: "Ver", emoji: "👐" },
      { text: "Gel", emoji: "➡️" },
      { text: "Git", emoji: "🚶" },
      { text: "Dur", emoji: "✋" },
      { text: "Ekle", emoji: "➕" },
      { text: "Aç",  emoji: "🔓" },
      { text: "Kapa", emoji: "🔒" },
    ],
  },
  {
    title: "Duygular",
    data: [
      { text: "İstiyorum", emoji: "❤️" },
      { text: "İstemiyorum", emoji: "💔" },
      { text: "Severim",   emoji: "😍" },
      { text: "Sevmem",    emoji: "😒" },
    ],
  },
];

const NewTextScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => setUserId(id));
  }, []);

  useEffect(() => {
    if (!userId) return;
    firestore()
      .collection('users')
      .doc(userId)
      .get()
      .then(userDoc => {
        const caregiverId = userDoc.data()?.caregiverId;
        if (!caregiverId) {
          Alert.alert('Hata', 'Bakıcınız bulunamadı.');
          return;
        }
        const convId =
          userDoc.data().status === 'Hasta'
            ? `${userId}_${caregiverId}`
            : `${caregiverId}_${userId}`;
        return firestore()
          .collection('messages')
          .doc(convId)
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .onSnapshot(snap => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });
      });
  }, [userId]);

  const sendMessage = async textToSend => {
    if (!textToSend.trim()) {
      Alert.alert('Hata', 'Lütfen bir mesaj yazın.');
      return;
    }
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      const caregiverId = userDoc.data()?.caregiverId;
      if (!caregiverId) {
        Alert.alert('Hata', 'Bakıcınız bulunamadı.');
        return;
      }
      const convId =
        userDoc.data().status === 'Hasta'
          ? `${userId}_${caregiverId}`
          : `${caregiverId}_${userId}`;
      await firestore()
        .collection('messages')
        .doc(convId)
        .collection('messages')
        .add({
          senderId: userId,
          text: textToSend,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
      setMessage('');
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', 'Mesaj gönderilirken bir sorun oluştu.');
    }
  };

  const clearMessages = () => {
    Alert.alert(
      'Mesajları Temizle',
      'Tüm mesajları silmek istediğinize emin misiniz?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            const userDoc = await firestore().collection('users').doc(userId).get();
            const caregiverId = userDoc.data()?.caregiverId;
            if (!caregiverId) {
              Alert.alert('Hata', 'Bakıcınız bulunamadı.');
              return;
            }
            const convId =
              userDoc.data().status === 'Hasta'
                ? `${userId}_${caregiverId}`
                : `${caregiverId}_${userId}`;
            const msgRef = firestore()
              .collection('messages')
              .doc(convId)
              .collection('messages');
            const snap = await msgRef.get();
            const batch = firestore().batch();
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            setMessages([]);
          },
        },
      ]
    );
  };

  // Ekranlar:
  const renderCategorySelection = () => (
    <SafeAreaView style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>Mesaj Kategorisi Seçin</Text>
      <TouchableOpacity
        style={styles.categoryButton}
        onPress={() => setSelectedCategory('HizliSohbet')}
      >
        <Text style={styles.categoryButtonText}>1 - Hızlı Sohbet</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.categoryButton}
        onPress={() => setSelectedCategory('TemelSozcukler')}
      >
        <Text style={styles.categoryButtonText}>2 - Temel Sözcükler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.categoryButton}
        onPress={() => setSelectedCategory('Klavye')}
      >
        <Text style={styles.categoryButtonText}>3 - Klavye</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  const renderQuickChat = () => (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>Hızlı Sohbetler</Text>
      <FlatList
        data={quickMessagesList}
        numColumns={2}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridItem} onPress={() => sendMessage(item)}>
            <Text style={styles.gridItemText}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.gridContainer}
      />
      <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCategory(null)}>
        <Text style={styles.backButtonText}>Geri</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  const renderBasicWords = () => (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>Temel Sözcükler</Text>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        {basicWordsCategories.map((cat, idx) => (
          <View key={idx} style={styles.categorySection}>
            <Text style={styles.categoryHeader}>{cat.title}</Text>
            <View style={styles.categoryButtonsContainer}>
              {cat.data.map((it, j) => (
                <TouchableOpacity
                  key={j}
                  style={styles.gridItem}
                  onPress={() => sendMessage(it.emoji ? `${it.emoji} ${it.text}` : it.text)}
                >
                  <Text style={styles.gridItemText}>
                    {it.emoji ? `${it.emoji} ` : ''}
                    {it.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCategory(null)}>
        <Text style={styles.backButtonText}>Geri</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  const renderChat = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatHeaderTitle}>Mesajlar (Klavye)</Text>
        {messages.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearMessages}>
            <Text style={styles.clearButtonText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageCard,
              item.senderId === userId
                ? { alignSelf: 'flex-end', backgroundColor: neonPurple }
                : { alignSelf: 'flex-start', backgroundColor: '#E8EAF6' },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.senderId === userId ? { color: white } : { color: greyDark },
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı buraya yazın..."
          placeholderTextColor="#B0B0B0"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage(message)}>
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCategory(null)}>
        <Text style={styles.backButtonText}>Kategorilere Dön</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      { !selectedCategory
        ? renderCategorySelection()
        : selectedCategory === 'HizliSohbet'
          ? renderQuickChat()
          : selectedCategory === 'TemelSozcukler'
            ? renderBasicWords()
            : renderChat()
      }
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
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  categoryContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  categoryTitle: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryButton: {
    backgroundColor: '#8063D6',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: '60%',
    alignItems: 'center',
  },
  categoryButtonText: {
    color: white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: white,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  gridContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  gridItem: {
    backgroundColor: '#8063D6',
    padding: 15,
    borderRadius: 10,
    margin: 8,
    minWidth: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemText: {
    color: white,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#8063D6',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: white,
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  chatHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: neonPurple,
  },
  clearButton: {
    backgroundColor: neonPink,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  clearButtonText: {
    color: white,
    fontSize: 14,
    fontWeight: '600',
  },
  messageCard: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: white,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  sendButton: {
    backgroundColor: neonPurple,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  sendButtonText: {
    color: white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: neonPurple,
    marginBottom: 10,
  },
  categoryButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',  
  },
});

export default NewTextScreen;
