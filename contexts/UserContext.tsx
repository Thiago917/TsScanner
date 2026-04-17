import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";

export type UserType = {
    id: number;
    name: string;
    email: string;
    departments_id: number;
    push_token: string;
}

type User = {
    user: UserType | null;
    loadUser: () => Promise<void> 
    setUser: (id: number, updates: Partial<UserType>) => void
}

const UserContext = createContext<User>({} as User);
 
export const UserProvider = ({children} : {children: React.ReactNode}) => {

    const [user, setUserState] = useState<UserType | null>(null);
    const api_url = process.env.EXPO_PUBLIC_API_URL

    const loadUser = async () => {
        try{
            const token = await AsyncStorage.getItem('@userToken')

            if(!token) return router.replace('/login');
            const response = await axios.get(`${api_url}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const res = response.data
            if(res.error){
                console.log('Erro ao buscar dados do usuário | ', res.message)
                return router.replace('/login')
            }

            setUserState(res[0])
        }
        catch(err){
            console.log('Erro ao buscar dados do usuário | ', err)
            return router.replace('/login')
        }
    }

    const setUser = async (id: number, updates: Partial<UserType>) => {
        if(!user) return;
        const prev = user;
        try{
            const response = await axios.patch(`${api_url}/update-me/${id}`, updates)
            const res = response.data

            if(res.error){
                console.log('Erro ao atualizar dados do usuário | ', res.message)
                setUserState(prev);
                return;
            }

            setUserState(res)
        }
        catch(err){
            setUserState(prev);
            console.log('Erro ao atualizar dados do usuário | ', err)
        }
    }
    
    useEffect(() => {
        loadUser()
    }, [])


    return(
        <UserContext.Provider value={{user, loadUser, setUser}}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => useContext(UserContext)