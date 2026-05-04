import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { createEchoInstance } from "../services/echo";
import { useUser } from "./UserContext";


type OrderItemsType ={
    id: number;
    product_code: string;
    po_id: string;
    quantity: number;
    separated: number;
    chekced: number
    status: number
    
}

type OrderType = {
    id: number;
    order_code: string;
    quantity: number;
    picked: number;
    product_code: string;
    items: OrderItemsType[];
    family: string;
    place: string;
    amount: number;
    status: number;
    separating_at: string;
    separated_at: string;
    signed_to: number;
    check_to: number;
    checking_at: string;
    checked_at: string;
    isReq: boolean;
}

type Order = {
    orders: OrderType[];
    checking: OrderType[];
    loadOrders: () => Promise<void>;
    setOrders: (op: string, updates: Partial<OrderType>) => Promise<void>
}

const api_url = process.env.EXPO_PUBLIC_API_URL;

const ProductionOrdersContext = createContext<Order>({} as Order);

export const ProductionOrdersProvider = ({children} : {children: React.ReactNode}) => {

    const [orders, setOrdersState] = useState<OrderType[]>([]);
    const [checking, setCheckingState] = useState<OrderType[]>([]);
    const {user} = useUser()
    
    const loadOrders = async () => {
        try {
            const response = await axios.get(`${api_url}/warehouse/list`);
            const res = response.data
            const ordersArr: OrderType[] = [];
            const checkingArr: OrderType[] = [];
            res.forEach((item: any) => {
                const isUserOrAdmin = Number(user?.departments_id) === -1;
                
                if ((Number(item.signed_to) === Number(user?.id) || isUserOrAdmin) && (item.status === 1 || item.status === 2)) {
                    ordersArr.push(item);
                } else if ((Number(item.check_to) === Number(user?.id) || isUserOrAdmin) && item.status === 7) {
                    checkingArr.push(item);
                }
            });

            setOrdersState(ordersArr);
            setCheckingState(checkingArr);
            }
        catch(err) {
            Alert.alert('Erro', `Erro ao carregar pedidos de almoxarifado... ${err}`);
            console.log(err);
        }
    }

    const setOrders = async (op: string, updates: Partial<OrderType>) => {
        if(!orders) return;
        const prev = orders;
            
        try {
            
            const response = await axios.patch(`${api_url}/warehouse/update-op/${op}`, updates)
            const res = response.data

            if(res.error){
                console.log(res.message)
                setOrdersState(prev)
                return;
            }

            setOrdersState(prev => {
                return prev.map((item) => String(item.order_code) === op ? {...item, ...updates} : item)
            })

        }
        catch(err){

            setOrdersState(prev)
            console.log('Erro ao atualizar ordem de produção na separação! - ', err)
        }
    }

    useEffect(() => {

        if(!user?.id)return;

        let echo:any = null;

        const initializeEcho = async () => {
            loadOrders()
            const echo = createEchoInstance();
            echo.channel(`new-order-to-${user.id}`).listen('.orders', () => loadOrders());
        }

        initializeEcho();

        return () => {
            if(echo){
                echo.disconnect();
                console.log('Echo foi desconectado')
            }
        }

    }, [user?.id])

    return(
        <ProductionOrdersContext.Provider value={{orders, loadOrders, setOrders, checking}}>
            {children}
        </ProductionOrdersContext.Provider>
    )
}

export const useOrders = () => useContext(ProductionOrdersContext)
