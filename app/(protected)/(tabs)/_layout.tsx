import { WifiBadge } from "@/component/WifiBadge";
import { ProductionOrdersProvider, useOrders } from "@/contexts/ProductionOrdersContext";
import { SalesOrdersProvider, useSalesOrders } from "@/contexts/salesOrdersContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Tabs } from "expo-router";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

function InnerTabs() {
  const { user, setUser, loading } = useUser();
  const { checking, orders } = useOrders();
  const { salesOrders, saleChecking } = useSalesOrders()

  const userRole = user?.departments_id?.toString() || '';

  const registerForPushNotificationsAsync = useCallback(async () => {
    if (!Device.isDevice || !user?.id) return;

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
      
      await setUser(Number(user.id), { push_token: token });
      console.log('Push token atualizado com sucesso:', token);
    
    } catch (error) {
      console.error('Erro ao registrar push token:', error);
    }
  }, [user?.id, user?.push_token, setUser]);

  useEffect(() => {
    if (!loading && user?.id) {
      registerForPushNotificationsAsync();
    }
  }, [loading, user?.id, registerForPushNotificationsAsync]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a27' }}>
        <ActivityIndicator size="large" color="#ffa704" />
      </View>
    );
  }

  if (!user) return null;

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
          href: (userRole === '12' || userRole === '-1') ? '/shipment' : null,
          title: 'Separação',
          headerTitleAlign: 'center',
          headerTitle: 'EXPEDIÇÃO',
          headerRight: () => <WifiBadge />,
          tabBarBadge: salesOrders.length > 0 ? salesOrders.length : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ffa704', color: 'white', fontSize: 10 },
          tabBarIcon: ({color}) => <Ionicons name='storefront-outline' size={15} color={color} />
        }}
      />

      <Tabs.Screen 
        name="warehouse" 
        options={{ 
          href: (userRole === '6' || userRole === '-1') ? '/warehouse' : null,
          title: 'Separação',
          headerTitleAlign: 'center',
          headerTitle: 'ALMOXARIFADO',
          headerRight: () => <WifiBadge />,
          tabBarBadge: orders.length > 0 ? orders.length : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ffa704', color: 'white', fontSize: 10 },
          tabBarIcon: ({color}) => <Ionicons name='barcode-outline' size={18} color={color}/>
        }}
      />

      <Tabs.Screen 
        name="checking" 
        options={{ 
          href: (userRole === '6' || userRole === '-1') ? '/checking' : null,
          title: 'Conferência',
          headerRight: () => <WifiBadge />,
          headerTitleAlign: 'center',
          headerTitle: 'ALMOXARIFADO',
          tabBarBadge: checking.length > 0 ? checking.length : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ffa704', color: 'white', fontSize: 10 },
          tabBarIcon: ({color}) => <Ionicons name='checkmark-circle-outline' size={18} color={color}/>
        }}
      />

      <Tabs.Screen 
        name="ship-checking" 
        options={{ 
          href: (userRole === '12' || userRole === '-1') ? '/ship-checking' : null,
          title: 'Conferência',
          headerRight: () => <WifiBadge />,
          headerTitleAlign: 'center',
          headerTitle: 'EXPEDIÇÃO',
          tabBarBadge: saleChecking.length > 0 ? saleChecking.length : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ffa704', color: 'white', fontSize: 10 },
          tabBarIcon: ({color}) => <Ionicons name='file-tray-full-outline' size={18} color={color}/>
        }} 
      />
          
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Meu perfil',
          headerRight: () => <WifiBadge />,
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