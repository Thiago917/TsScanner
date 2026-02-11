import { Stack } from "expo-router";

import '@/global.css';

export default function RootLayout() {
  return <Stack screenOptions={{
    title: 'TS Go',
      headerTintColor: 'ghostwhite',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerStyle:{
      backgroundColor: '#1a1a27',
    }
  }}/>;
}
