import { Stack } from "expo-router"

export default function warehouseCheckingLayout() {
    return(
        <Stack screenOptions={{
            title: 'Conferência', 
            headerTitleAlign: 'center', 
            headerStyle: { 
                backgroundColor: '#1a1a27'
            }, 
            headerTintColor: 'ghostwhite'
        }}>
                        
            <Stack.Screen name='[conferenceOp]' options={{ headerShown: true }} />
        </Stack>
    )
}