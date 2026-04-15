import { ProductionOrdersProvider, useOrders } from "@/contexts/ProductionOrdersContext";
import { SalesOrdersProvider } from "@/contexts/salesOrdersContext";
import { UserProvider } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";

function InnerTabs() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { checking } = useOrders();

  useEffect(() => {
    AsyncStorage.getItem('@userRole').then((val) => {
      setRole(val);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: process.env.EXPO_PUBLIC_MAIN_COLOR,
      headerStyle: { backgroundColor: '#1a1a27' },
      headerTintColor: 'ghostwhite',
      tabBarStyle: {
        height: 60,
      },
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