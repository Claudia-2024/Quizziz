import 'react-native-reanimated';
import { Slot, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { ThemeProvider } from '@/theme/global';
import { StatusBar } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { OfflineProvider } from '@/context/OfflineContext';
import { useOfflineInit } from '@/hooks/useOfflineInit';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const [fontsLoaded] = useFonts({
    AbeezeeItalic: require('../assets/fonts/ABeeZee-Italic.ttf'),
    AbeezeeRegular: require('../assets/fonts/ABeeZee-Regular.ttf'),
    PoppinsRegular: require('../assets/fonts/Poppins-Regular.ttf'),
    PoppinsSemiBold: require('../assets/fonts/Poppins-SemiBold.ttf'),
  });

  const { isInitialized } = useOfflineInit();

  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <SafeAreaProvider>
            <StatusBar />
            <Slot />
          </SafeAreaProvider>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutContent />;
}

