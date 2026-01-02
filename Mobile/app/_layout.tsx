import 'react-native-reanimated';
import { Slot, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { ThemeProvider } from '@/theme/global';
import { StatusBar } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    AbeezeeItalic: require('../assets/fonts/ABeeZee-Italic.ttf'),
    AbeezeeRegular: require('../assets/fonts/ABeeZee-Regular.ttf'),
    PoppinsRegular: require('../assets/fonts/Poppins-Regular.ttf'),
    PoppinsSemiBold: require('../assets/fonts/Poppins-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar />
          <Slot />  
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
