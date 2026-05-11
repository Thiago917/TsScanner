import '@/global.css';
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

    useEffect(() => {
        if (loaded || error) {
            // Esconde a Splash Screen assim que as fontes carregarem ou der erro
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    // Se as fontes ainda não carregaram, não renderiza nada (mantém a Splash)
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
