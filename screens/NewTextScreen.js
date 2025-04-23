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
// Önceki kodunuzdaki "Temel Sözcükler" dizisini
// ileride referans için tutabilirsiniz (opsiyonel)
// --------------------------------------------------
const basicWordsList = [
  "❓ 5N 1K Soruları",
  "🙂 Ben",
  "😉 Sen",
  "😐 O",
  "👫 Biz",
  "👬 Siz",
  "👥 Onlar",
  "🤲 Al",
  "👐 Ver",
  "❤️ İstiyorum",
  "😍 Severim",
  "😒 Sevmem",
  "🆘 Yardım Et",
  "➡️ Gel",
  "✋ Dur",
  "🚶 Git",
  "🔓 Aç",
  "🔒 Kapa",
  "➕ Ekle",
];

// --------------------------------------------------
// Yeni alt başlıklar (5N1K, Özneler, Fiiller, Duygular)
// Her kategori, buton etiketlerini içeriyor.
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

  // Seçilen kategori (HizliSohbet, TemelSozcukler, Klavye)
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- useEffect: userId çekiyoruz ---
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    fetchUserId();
  }, []);

  // --- useEffect: Mesajları firestore'dan çek ---
  useEffect(() => {
    if (userId) {
      const fetchMessages = async () => {
        const userDoc = await firestore().collection('users').doc(userId).get();
        const caregiverId = userDoc.data()?.caregiverId;

        if (!caregiverId) {
          Alert.alert('Hata', 'Bakıcınız bulunamadı.');
          return;
        }

        const conversationId =
          userDoc.data()?.status === 'Hasta'
            ? `${userId}_${caregiverId}`
            : `${caregiverId}_${userId}`;

        const unsubscribe = firestore()
          .collection('messages')
          .doc(conversationId)
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .onSnapshot((snapshot) => {
            const fetchedMessages = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setMessages(fetchedMessages);
          });

        return unsubscribe;
      };

      fetchMessages();
    }
  }, [userId]);

  // --- Mesaj Gönder ---
  const sendMessage = async (textToSend) => {
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

      const conversationId =
        userDoc.data()?.status === 'Hasta'
          ? `${userId}_${caregiverId}`
          : `${caregiverId}_${userId}`;

      await firestore()
        .collection('messages')
        .doc(conversationId)
        .collection('messages')
        .add({
          senderId: userId,
          text: textToSend,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });

      setMessage('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      Alert.alert('Hata', 'Mesaj gönderilirken bir sorun oluştu.');
    }
  };

  // --- Mesajları Temizle (clearMessages) ---
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

            const conversationId =
              userDoc.data()?.status === 'Hasta'
                ? `${userId}_${caregiverId}`
                : `${caregiverId}_${userId}`;

            const messagesRef = firestore()
              .collection('messages')
              .doc(conversationId)
              .collection('messages');

            const snapshot = await messagesRef.get();
            const batch = firestore().batch();

            snapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });

            await batch.commit();
            setMessages([]);
          },
        },
      ]
    );
  };

  // --------------------------------------------------------
  // 1) Kategori Seçim Ekranı (Seçim Yapılmadıysa)
  // --------------------------------------------------------
  if (!selectedCategory) {
    return (
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
  }

  // --------------------------------------------------------
  // 2) Hızlı Sohbet Ekranı
  // --------------------------------------------------------
  if (selectedCategory === 'HizliSohbet') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerText}>Hızlı Sohbetler</Text>

        {/* 2 sütunlu liste */}
        <FlatList
          data={quickMessagesList}
          numColumns={2}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => sendMessage(item)}
            >
              <Text style={styles.gridItemText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.gridContainer}
        />

        {/* Geri Butonu */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------------
  // 3) Temel Sözcükler Ekranı
  //    - 5N1K, Özneler, Fiiller, Duygular
  //    Hepsi TEK EKRANDA, kaydırılabilir ScrollView içinde.
  //    En altta Geri butonunu koruyoruz.
  // --------------------------------------------------------
  if (selectedCategory === 'TemelSozcukler') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerText}>Temel Sözcükler</Text>

        {/* Kaydırılabilir alan; contentContainerStyle'da flexGrow kullanılarak içerik 
            ekranı doldurmasa bile kaydırma sağlanıyor */}
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
          {basicWordsCategories.map((cat, index) => (
            <View key={index} style={styles.categorySection}>
              <Text style={styles.categoryHeader}>{cat.title}</Text>
              <View style={styles.categoryButtonsContainer}>
                {cat.data.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.gridItem}
                    onPress={() => sendMessage(item.emoji ? `${item.emoji} ${item.text}` : item.text)}
                  >
                    <Text style={styles.gridItemText}>
                      {item.emoji ? `${item.emoji} ` : ''}{item.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Geri Butonu en altta */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------------
  // 4) Klavye Ekranı (Klasik Sohbet)
  // --------------------------------------------------------
  return (
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
        keyExtractor={(item) => item.id}
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

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedCategory(null)}
      >
        <Text style={styles.backButtonText}>Kategorilere Dön</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// === Stil Ayarları ===
const styles = StyleSheet.create({
  // Genel Ekran Yapısı
  container: {
    flex: 1,
    backgroundColor: '#E8F4F5FF',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  // Kategori Seçim Ekranı
  categoryContainer: {
    flex: 1,
    backgroundColor: '#E8F4F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  categoryTitle: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: 'bold',
    color: greyDark,
  },
  categoryButton: {
    backgroundColor: neonPurple,
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
  // Ortak Başlıklar
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: neonPurple,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  // Grid Dizilimi (Hızlı Sohbet vb.)
  gridContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  gridItem: {
    backgroundColor: neonPurple,
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
  // Geri Butonu
  backButton: {
    backgroundColor: '#757575',
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
  // Sohbet (Klavye) Başlık
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
  // Mesaj Kartı
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
  // Mesaj Yazma Alanı
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
  // Temel Sözcükler Kategorileri
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
