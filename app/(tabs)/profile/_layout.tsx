import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function profileLayout(){
    return(
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{headerShown: false}}>
                <Stack.Screen name="index"/>
            </Stack>
        </>
    )
}