import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

// Ekranlarınız (Projenize göre düzenleyin)
import FirstScreen from './screens/FirstScreen';
import Login from './screens/Login';
import Wizard from './screens/Wizard';
import Home from './screens/Home';
import Drawing from './screens/Drawing';
import Exercise from './screens/Exercise';
import Profile from './screens/Profile';
import MatchingGame from './screens/MatchingGame';
import MemoryGame from './screens/MemoryGame';
import BalloonGame from './screens/BalloonGame';
import NewTextScreen from './screens/NewTextScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Basit bir Splash ekranı: 
 * Kullanıcının Firestore'dan rolünü okuyup BottomTabs'e yönlendirecek.
 */
function Splash({ navigation }) {
  useEffect(() => {
    const checkUser = async () => {
      try {
        const uid = await AsyncStorage.getItem('userId');
        if (!uid) {
          // Giriş yoksa FirstScreen'e yönlendir
          navigation.replace('FirstScreen');
          return;
        }
        // Firestore'dan users/{uid} dokümanını oku
        const userDoc = await firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
          navigation.replace('FirstScreen');
          return;
        }
        const userData = userDoc.data(); // { status: "Hasta" veya "Bakıcı", ... }
        // "BottomTabs" ekranına, route parametresi olarak role: userData.status gönder
        navigation.replace('BottomTabs', { role: userData.status });
      } catch (error) {
        console.error("Splash: Hata", error);
        navigation.replace('FirstScreen');
      }
    };
    checkUser();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Yükleniyor...</Text>
    </View>
  );
}

/** 
 * Alt çubuk (Tab Navigator) 
 * route.params.role => "Hasta" veya "Bakıcı" 
 * Bu fonksiyon, rol'e göre <Tab.Screen> tanımlarını koşullu olarak ekliyor.
 */
function BottomTabs({ route }) {
  const role = route.params?.role || 'Hasta'; // Varsayılan hasta diyelim

  return (
    <Tab.Navigator
      screenOptions={({ route: tabRoute }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4C6DAFFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#fff' },
        tabBarIcon: ({ color, size }) => {
          // Tüm tablarda aynı mantık, isme göre ikon atayabilirsiniz
          let iconName = '';
          if (tabRoute.name === 'Home') iconName = 'home';
          else if (tabRoute.name === 'Drawing') iconName = 'pencil';
          else if (tabRoute.name === 'Mesaj') iconName = 'envelope';
          else if (tabRoute.name === 'Exercise') iconName = 'heartbeat';
          else if (tabRoute.name === 'Profile') iconName = 'user';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      {role === 'Bakıcı' ? (
        // Eğer Bakıcı ise 2 sekme
        <>
          <Tab.Screen name="Home" component={Home} options={{ title: 'Ana Sayfa' }} />
          <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profil' }} />
        </>
      ) : (
        // Eğer Hasta ise 5 sekme
        <>
          <Tab.Screen name="Home" component={Home} options={{ title: 'Ana Sayfa' }} />
          <Tab.Screen name="Drawing" component={Drawing} options={{ title: 'Çizim' }} />
          <Tab.Screen name="Mesaj" component={NewTextScreen} options={{ title: 'Mesaj' }} />
          <Tab.Screen name="Exercise" component={Exercise} options={{ title: 'Egzersiz' }} />
          <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profil' }} />
        </>
      )}
    </Tab.Navigator>
  );
}

const AppStack = createNativeStackNavigator();

/** 
 * Ana Uygulama 
 * Splash -> (Firestore'dan role okumak) -> BottomTabs 
 */
export default function App() {
  return (
    <NavigationContainer>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        {/* Splash, ilk açılışta userId + Firestore kontrolü yapacak */}
        <AppStack.Screen name="Splash" component={Splash} />
        
        {/* Giriş / Tanıtım Ekranları */}
        <AppStack.Screen name="FirstScreen" component={FirstScreen} />
        <AppStack.Screen name="Login" component={Login} />
        <AppStack.Screen name="Wizard" component={Wizard} />

        {/* Alt çubuk, route parametresindeki role'e göre sekmeler */}
        <AppStack.Screen name="BottomTabs" component={BottomTabs} />

        {/* Oyun / diğer ekranlar */}
        <AppStack.Screen name="MatchingGame" component={MatchingGame} />
        <AppStack.Screen name="MemoryGame" component={MemoryGame} />
        <AppStack.Screen name="BalloonGame" component={BalloonGame} />
      </AppStack.Navigator>
    </NavigationContainer>
  );
}
