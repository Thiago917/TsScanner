import { Stack } from "expo-router";

export default function CheckingLayout(){
    return(
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="index"/>
            <Stack.Screen name="[conferenceOp]"/>
        </Stack>
    )
}