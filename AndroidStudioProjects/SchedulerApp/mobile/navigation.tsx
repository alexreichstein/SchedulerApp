import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import App from './App';
import TemplatesScreen from './screens/TemplatesScreen';

export type RootStackParamList = {
  Home: undefined;
  Templates: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={App} />
        <Stack.Screen name="Templates" component={TemplatesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}