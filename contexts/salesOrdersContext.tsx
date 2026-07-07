import { createEchoInstance } from "@/services/echo";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "./UserContext";

type salesOrdersItems = {
    id: number;
    product_code: string;
    quantity: number;
    separated: number;
    checked: number;
    status: number;
    serials: any[];
    product_id: number;
}

type salesOrdersType = {
    id: number;
    status: number;
    order_code: string;
    items_sum_quantity: string | number | null; 
    items_sum_separated: string | number | null;
    items: salesOrdersItems[];
    transp: string;
    separating_at: string;
    separated_at: string;
    checking_at: string;
    checked_at: string;
    signed_to: number;
    check_to: number;
}

type salesOrdersContextData = {
    saleChecking: salesOrdersType[];
    salesOrders: salesOrdersType[];
    loadSalesOrders: () => Promise<void>;
    updateSalesOrders: (order: string, updates: Partial<salesOrdersType>, onlyLocal?: boolean) => Promise<void>;
}

export const SalesOrdersContext = createContext<salesOrdersContextData>({} as salesOrdersContextData);

const api_url = process.env.EXPO_PUBLIC_API_URL;

export const SalesOrdersProvider = ({ children }: { children: React.ReactNode }) => {
    
    const [salesOrders, setSalesOrders] = useState<salesOrdersType[]>([]);
    const [saleChecking, setsaleChecking] = useState<salesOrdersType[]>([]);
    const { user } = useUser();

    const loadSalesOrders = async () => {
        if (!user?.id) return;

        try {
            const response = await axios.get(`${api_url}/shipment/list`);
            const res = response.data;
            const ordersArr: salesOrdersType[] = [];
            const saleCheckingArr: salesOrdersType[] = [];

            res.forEach((item: any) => {
                const isUserOrAdmin = Number(user?.departments_id) === -1;
                if ((Number(item.signed_to) === Number(user?.id) || isUserOrAdmin) && (item.status === 7 || item.status === 0)) {
                    ordersArr.push(item);
                    console.log(item)
                } else if ((Number(item.check_to) === Number(user?.id) || isUserOrAdmin) && item.status === 4) {
                    saleCheckingArr.push(item);
                }
            });

            setSalesOrders(ordersArr);
            setsaleChecking(saleCheckingArr);
        } catch (err) {
            console.error('Erro ao carregar expedição:', err);
        }
    };

    const updateSalesOrders = async (order: string, updates: Partial<salesOrdersType>, onlyLocal = false) => {
        try {
            if (!onlyLocal) {
                const response = await axios.patch(`${api_url}/shipment/update-sale/${order}`, updates);
                const res = response.data;

                if (res.error) {
                    console.log(res.message);
                    return;
                }
            }

            setSalesOrders(prev => prev.map((item) => 
                String(item.order_code) === String(order) || String(item.id) === String(order)
                    ? { ...item, ...updates } 
                    : item
            ));

            setsaleChecking(prev => prev.map((item) => 
                String(item.order_code) === String(order) || String(item.id) === String(order)
                    ? { ...item, ...updates } 
                    : item
            ));

        } catch (err) {
            console.log("Erro ao atualizar ordem de venda no contexto:", err);
        }
    };

    useEffect(() => {
        if (!user?.id) return;

        let echoInstance: any = null;

        loadSalesOrders();

        try {
            echoInstance = createEchoInstance();
            if (echoInstance) {
                echoInstance
                    .channel(`new-order-to-${user.id}`)
                    .listen('.orders', () => {
                        console.log('Evento recebido via Echo! Atualizando lista de vendas...');
                        loadSalesOrders();
                    });
                console.log('Echo conectado com sucesso na expedição.');
            }
        } catch (error) {
            console.error("Falha ao inicializar o Echo na expedição:", error);
        }

        return () => {
            if (echoInstance) {
                echoInstance.disconnect();
                console.log('Echo foi desconectado com sucesso do canal antigo de expedição');
            }
        };
    }, [user?.id]);

    return (
        <SalesOrdersContext.Provider value={{ salesOrders, loadSalesOrders, saleChecking, updateSalesOrders }}>
            {children}
        </SalesOrdersContext.Provider>
    );
};

export const useSalesOrders = () => useContext(SalesOrdersContext);