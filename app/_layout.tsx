import { NetInfoProvider } from '@/contexts/NetInfoContext';
import '@/global.css';
import useBackgroundSync from '@/services/BackgroundSync';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from "expo-status-bar";
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

function BackgroundSyncApp() {
    useBackgroundSync();
    return null;
}

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...FontAwesome.font,
        ...MaterialIcons.font,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <NetInfoProvider>
            <BackgroundSyncApp />
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='index' />
                <Stack.Screen name='login' />
            </Stack>
        </NetInfoProvider>
    );
}