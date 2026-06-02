import { Stack } from "expo-router";

export default function bipLayout(){
    return(
        <Stack screenOptions={{
            title: 'Separação', 
            headerTitleAlign: 'center', 
            headerStyle: { 
                backgroundColor: '#1a1a27'
            }, 
            headerTintColor: 'ghostwhite'
        }}>
            <Stack.Screen name="[order]"/>
        </Stack>
    )
}