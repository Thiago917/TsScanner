import AsyncStorge from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";


export default function indexScreen(){


    useEffect(() => {

        const check = async () => {
            try{

                const token = await AsyncStorge.getItem('@userToken')
                const role = await AsyncStorge.getItem('@userRole')

                    if(!token || !role){
                        router.replace('/login')
                        return;
                    }

                switch(role){
                    case '12':
                        router.replace('/shipment')
                        break;
                    case '6':
                        router.replace('/warehouse')
                        break;
                    default:
                        router.replace('/shipment')
                        break;
                    }
            }
            catch(err){
                console.log('Erro ao resgatar dados do async storage | ', err)
                return router.replace('/login')
            }
        }

        check()
    }, [])

    return(
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator color={process.env.EXPO_PUBLIC_MAIN_COLOR} />
        </View>
    )
}