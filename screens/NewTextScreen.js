import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NewTextScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchMessages = async () => {
        const userDoc = await firestore().collection('users').doc(userId).get();
        const caregiverId = userDoc.data()?.caregiverId;

        if (!caregiverId) {
          Alert.alert('Hata', 'Bakıcınız bulunamadı.');
          return;
        }

        const conversationId = userDoc.data()?.status === 'Hasta'
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

  const sendMessage = async () => {
    if (!message.trim()) {
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

      const conversationId = userDoc.data()?.status === 'Hasta'
        ? `${userId}_${caregiverId}`
        : `${caregiverId}_${userId}`;

      await firestore()
        .collection('messages')
        .doc(conversationId)
        .collection('messages')
        .add({
          senderId: userId,
          text: message,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });

      setMessage('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
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

            const conversationId = userDoc.data()?.status === 'Hasta'
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Mesajlar</Text>
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
                ? { alignSelf: 'flex-end', backgroundColor: '#4A90E2' }
                : { alignSelf: 'flex-start', backgroundColor: '#E8EAF6' },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.senderId === userId ? { color: '#FFFFFF' } : { color: '#333' },
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
          value={message}
          onChangeText={setMessage}
          placeholderTextColor="#B0B0B0"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  clearButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default NewTextScreen;
