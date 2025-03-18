import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ekranlar
import FirstScreen from './screens/FirstScreen';
import Login from './screens/Login';
import Wizard from './screens/Wizard';
import Home from './screens/Home';
import Drawing from './screens/Drawing';
import Exercise from './screens/Exercise';
import MatchingGame from './screens/MatchingGame';
import MemoryGame from './screens/MemoryGame';
import BalloonGame from './screens/BalloonGame';
import NewTextScreen from './screens/NewTextScreen'; // Yeni ekranı içeri aktarın


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Çizim') iconName = 'pencil';
        else if (route.name === 'Egzersiz') iconName = 'heartbeat';
        else if (route.name === 'Mesaj') iconName = 'envelope'; // Yeni ekran için ikon
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4C6DAFFF',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: { backgroundColor: '#fff' },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={Home} options={{ title: 'Ana Sayfa' }} />
    <Tab.Screen name="Çizim" component={Drawing} options={{ title: 'Çizim' }} />
    <Tab.Screen name="Mesaj" component={NewTextScreen} options={{ title: 'Mesaj' }} />
    <Tab.Screen name="Egzersiz" component={Exercise} options={{ title: 'Egzersiz' }} />
  </Tab.Navigator>
);

const App = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userId = await AsyncStorage.getItem('userId');
      const loginType = await AsyncStorage.getItem('loginType');
      setInitialRoute(userId && loginType ? 'BottomTabs' : 'FirstScreen');
    };

    checkLoginStatus();
  }, []);

  if (initialRoute === null) {
    return null; // Yükleniyor durumu
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FirstScreen" component={FirstScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Wizard" component={Wizard} />
        <Stack.Screen name="BottomTabs" component={MainTabs} />
        <Stack.Screen name="MatchingGame" component={MatchingGame} />
        <Stack.Screen name="MemoryGame" component={MemoryGame} />
        <Stack.Screen name="BalloonGame" component={BalloonGame} />


      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
