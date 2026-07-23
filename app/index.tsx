import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, View } from "react-native";


export default function indexScreen(){


    useEffect(() => {

        const check = async () => {
            try{

                const token = await AsyncStorage.getItem('@userToken')
                const role = await AsyncStorage.getItem('@userRole')
                console.log({token, role})
                    if(!token || !role){
                        router.replace('/login')
                        return;
                    }

                switch(role){
                    case '12':
                        router.replace('/(protected)/(tabs)/shipment')
                        break;
                    case '6':
                        router.replace('/(protected)/(tabs)/warehouse')
                        break;
                    default:
                        router.replace('/(protected)/(tabs)/shipment')
                        break;
                    }
            }
            catch(err){
                console.log('Erro ao resgatar dados do async storage | ', err)
                Alert.alert('Erro', `Erro ao realizar login | ${err}`)
                return router.replace('/login')
            }
        }

        check()
    }, [])

    return(
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator color={'#000'} />
        </View>
    )
}