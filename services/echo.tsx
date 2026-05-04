import Echo from 'laravel-echo';
import { Pusher } from 'pusher-js/react-native';

// Importante manter para o Echo encontrar o cliente globalmente no mobile
(global as any).Pusher = Pusher;
Pusher.logToConsole = true;

export const createEchoInstance = () => {
    return new Echo({
        broadcaster: 'reverb',
        key: process.env.EXPO_PUBLIC_PUSHER_KEY,
        wsHost: process.env.EXPO_PUBLIC_PUSHER_HOST,
        wsPort: 443,
        wssPort: 443,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
    });
};