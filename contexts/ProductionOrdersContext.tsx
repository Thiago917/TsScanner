import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { createEchoInstance } from "../services/echo";
import { useUser } from "./UserContext";

type OrderItemsType = {
    id: number;
    product_code: string;
    po_id: string;
    quantity: number;
    separated: number;
    chekced: number; // Mantido o typo original do seu banco/tipo (chekced)
    status: number;
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
    setOrders: (op: string, updates: Partial<OrderType>, onlyLocal?: boolean) => Promise<void>;
}

const api_url = process.env.EXPO_PUBLIC_API_URL;

const ProductionOrdersContext = createContext<Order>({} as Order);

export const ProductionOrdersProvider = ({ children }: { children: React.ReactNode }) => {

    const [orders, setOrdersState] = useState<OrderType[]>([]);
    const [checking, setCheckingState] = useState<OrderType[]>([]);
    const { user } = useUser();
    
    const loadOrders = async () => {
        try {

            // console.log(`consultando api: ${api_url}/warehouse/list`)
            const response = await axios.get(`${api_url}/warehouse/list`);
            const res = response.data;
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

            setOrdersState(prevOrders => {
                return ordersArr.map(newOrder => {
                    const existing = prevOrders.find(o => o.id === newOrder.id);
                    if (existing && (existing.status === 2 || existing.status === 1)) {
                        return existing; 
                    }
                    return newOrder;
                });
            });

            setCheckingState(prevChecking => {
                return checkingArr.map(newChecking => {
                    const existing = prevChecking.find(c => c.id === newChecking.id);
                    if (existing && existing.status === 7) {
                        return existing;
                    }
                    return newChecking;
                });
            });
        
        } catch (err: any) {
            Alert.alert('Erro', `Erro ao carregar pedidos de almoxarifado... ${err}`);
            console.log(err);
        }
    }

    const setOrders = async (op: string, updates: Partial<OrderType>, onlyLocal = false) => {
        if (!orders) return;
        const prev = orders;
        
        try {
            if (!onlyLocal) {
                const response = await axios.patch(`${api_url}/warehouse/update-op/${op}`, updates);
                const res = response.data;

                if (res.error) {
                    console.log(res.message);
                    setOrdersState(prev);
                    return;
                }
            }

            const mapUpdatedItems = (prevList: OrderType[]) => 
                prevList.map((item) => 
                    String(item.order_code) === String(op) || String(item.id) === String(op) || `REQ-${item.id}` === String(op)
                        ? { ...item, ...updates } 
                        : item
                );

            setOrdersState(prev => mapUpdatedItems(prev));
            setCheckingState(prev => mapUpdatedItems(prev));

        } catch (err) {
            if (!onlyLocal) setOrdersState(prev);
            console.log('Erro ao atualizar ordem de produção no contexto:', err);
        }
    }

    useEffect(() => {
        if (!user?.id) return;

        let echoInstance: any = null;

        const initializeEcho = async () => {
            await loadOrders();
            echoInstance = createEchoInstance();
            echoInstance.channel(`new-order-to-${user.id}`).listen('.orders', () => {
                console.log('Nova ordem recebida via WebSocket, atualizando com merge silencioso...');
                loadOrders();
            });
        }

        initializeEcho();

        return () => {
            if (echoInstance) {
                echoInstance.disconnect();
                console.log('Echo foi desconectado');
            }
        }
    }, [user?.id]);

    return (
        <ProductionOrdersContext.Provider value={{ orders, loadOrders, setOrders, checking }}>
            {children}
        </ProductionOrdersContext.Provider>
    )
}

export const useOrders = () => useContext(ProductionOrdersContext);