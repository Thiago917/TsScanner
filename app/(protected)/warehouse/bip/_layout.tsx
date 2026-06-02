import { Stack } from "expo-router";

export default function ProductionOrderLayout(){
    return(
        <Stack screenOptions={{
            title: 'Separação', 
            headerTitleAlign: 'center', 
            headerStyle: { 
                backgroundColor: '#1a1a27'
            }, 
            headerTintColor: 'ghostwhite'
        }}>
            <Stack.Screen name="[productionOrder]"/>
        </Stack>
    )
}