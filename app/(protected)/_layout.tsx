import { ProductionOrdersProvider } from "@/contexts/ProductionOrdersContext";
import { SalesOrdersProvider } from "@/contexts/salesOrdersContext";
import { UserProvider } from "@/contexts/UserContext";
import { Stack } from "expo-router";

export default function protectedLayout(){
    return (
        <UserProvider>
            <ProductionOrdersProvider>
                <SalesOrdersProvider>
                    <Stack screenOptions={{headerShown: false}}>
                        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
                        <Stack.Screen name='warehouse'/>
                        <Stack.Screen name='shipment' />
                    </Stack>
                </SalesOrdersProvider>
            </ProductionOrdersProvider>
        </UserProvider>
    );
}