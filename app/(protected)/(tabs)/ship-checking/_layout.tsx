import { Stack } from "expo-router";

export default function shipmentCheck(){
    return(
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="index"/>
        </Stack>
    )
}