import '@/global.css';
import BackgroundSync from '@/services/BackgroundSync';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons'; // Importe os que você usa
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from "expo-status-bar";
import { useEffect } from 'react';

// Impede a Splash Screen de sumir automaticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    // Carrega as fontes dos ícones
    const [loaded, error] = useFonts({
        ...FontAwesome.font,
        ...MaterialIcons.font,
    });

    BackgroundSync();

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='index' />
                <Stack.Screen name='login' />
            </Stack>
        </>
    );
}
