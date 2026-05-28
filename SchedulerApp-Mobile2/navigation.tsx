// Navigationskonfiguration för hela appen
// Använder bottom tabs för huvudnavigation
// Stack navigation för mallskärmen

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import CalendarScreen from './screens/CalendarScreen';
import ShoppingScreen from './screens/ShoppingScreen';
import TemplatesScreen from './screens/TemplatesScreen';

// Typ för stack-navigationen
export type RootStackParamList = {
  Main: undefined;
  Templates: undefined;
};

// Typ för flik-navigationen
type TabParamList = {
  Kalender: undefined;
  Handla: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Flik-navigator med kalender och handla
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
      }}
    >
      <Tab.Screen
        name="Kalender"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Handla"
        component={ShoppingScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🛒</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Stack-navigator med flikar och mallskärmen
export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Templates" component={TemplatesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}