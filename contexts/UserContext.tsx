import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

export type UserType = {
    id: number;
    name: string;
    email: string;
    departments_id: number;
    push_token: string;
}

type UserContextData = {
    user: UserType | null;
    loading: boolean;
    loadUser: () => Promise<void>;
    setUser: (id: number, updates: Partial<UserType>) => Promise<void>;
}

const UserContext = createContext<UserContextData>({} as UserContextData);
 
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUserState] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const api_url = process.env.EXPO_PUBLIC_API_URL;

    const loadUser = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('@userToken');

            if (!token) {
                setUserState(null);
                return router.replace('/login');
            }

            const response = await axios.get(`${api_url}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const res = response.data;
            if (res.error) {
                console.log('Erro ao buscar dados do usuário | ', res.message);
                setUserState(null);
                return router.replace('/login');
            }

            const userData = Array.isArray(res) ? res[0] : res;
            setUserState(userData);

        } catch (err) {
            console.log('Erro ao buscar dados do usuário (catch) | ', err);
            Alert.alert('', `${err}`)
            setUserState(null);
        } finally {
            setLoading(false);
        }
    };

    // FUNÇÃO SETUSER CORRIGIDA E ADAPTADA
    const setUser = async (id: number, updates: Partial<UserType>) => {
        if (!user) return;
        
        const previousUser = user; 

        try {
            const response = await axios.patch(`${api_url}/update-me/${id}`, updates);
            const res = response.data;

            if (res.error) {
                console.log('Erro ao atualizar dados do usuário na API | ', res.message);
                setUserState(previousUser); 
                return;
            }

            setUserState((prev) => {
                if (!prev) return null;
                const dadosAtualizados = (res && typeof res === 'object' && !res.message) ? res : updates;

                return {
                    ...prev,
                    ...dadosAtualizados
                };
            });

        } catch (err) {
            setUserState(previousUser);
            console.log('Erro na requisição de atualização do usuário | ', err);
        }
    };
    
    useEffect(() => {
        loadUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, loadUser, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);