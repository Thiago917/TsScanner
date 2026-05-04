import { ProductionOrdersProvider, useOrders } from "@/contexts/ProductionOrdersContext";
import { SalesOrdersProvider } from "@/contexts/salesOrdersContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

function InnerTabs() {

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useUser();
  const { checking, orders } = useOrders();

  const registerForPushNotificationsAsync = useCallback(async () => {
    if (!Device.isDevice) return;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('EAS Project ID não encontrado no config.');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      const old_token = user?.push_token;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      if (old_token === token) return;
      
      await setUser(Number(user?.id), { push_token: token });
      console.log('Push token atualizado:', token);
    
    } catch (error) {
      console.error('Erro ao registrar push token:', error);
    }
  }, [user, setUser]);

  useEffect(() => {
    AsyncStorage.getItem('@userRole').then((val) => {
      setRole(val);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user?.id) {
      registerForPushNotificationsAsync();
    }
  }, [user?.id, registerForPushNotificationsAsync]);

  if (loading) return null;

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: process.env.EXPO_PUBLIC_MAIN_COLOR,
      headerStyle: { backgroundColor: '#1a1a27' },
      headerTintColor: 'ghostwhite',
      tabBarStyle: { height: 60 },
    }}>

      <Tabs.Screen 
        name="shipment" 
        options={{ 
          href: (role === '12' || role === '-1') ? '/shipment' : null,
          title: 'EXPEDIÇÃO',
          headerTitleAlign: 'center',
          tabBarIcon: ({color}) => <Ionicons name='storefront-outline' size={15} color={color} />
        }}
      />

      <Tabs.Screen 
        name="warehouse" 
        options={{ 
          href: (role === '6' || role === '-1') ? '/warehouse' : null,
          title: 'Separação',
          headerTitleAlign: 'center',
          tabBarBadge: orders.length > 0 ? orders.length : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ffa704', color: 'white', fontSize: 10 },
          tabBarIcon: ({color}) => <Ionicons name='barcode-outline' size={18} color={color}/>
        }}
      />

      <Tabs.Screen 
        name="checking" 
        options={{ 
          href: (role === '6' || role === '-1') ? '/checking' : null,
          title: 'Conferência',
          headerTitleAlign: 'center',
          tabBarBadge: checking.length > 0 ? checking.length : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ffa704', color: 'white', fontSize: 10 },
          tabBarIcon: ({color}) => <Ionicons name='checkmark-circle-outline' size={18} color={color}/>
        }}
      />
          
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Meu perfil',
          headerTitleAlign: 'center',
          tabBarIcon: ({color}) => <Ionicons name='person-circle' size={18} color={color}/>
        }} 
      />
    </Tabs> 
  );
}

export default function TabsLayout() {
  return (
    <UserProvider>
      <ProductionOrdersProvider>
        <SalesOrdersProvider>
          <InnerTabs />
        </SalesOrdersProvider>
      </ProductionOrdersProvider>
    </UserProvider>
  );
}