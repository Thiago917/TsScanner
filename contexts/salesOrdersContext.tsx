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
}

type salesOrdersType = {
    id: number;
    order_code: string;
    items_sum_quantity: string | number | null; 
    items_sum_separated: string | number | null;
    items: salesOrdersItems[];
}

type salesOrdersContextData = {
    salesOrders: salesOrdersType[];
    loadSalesOrders: () => Promise<void>;
}

export const SalesOrdersContext = createContext<salesOrdersContextData>({
    salesOrders: [],
    loadSalesOrders: async () => {},
});

const api_url = process.env.EXPO_PUBLIC_API_URL;

export const SalesOrdersProvider = ({ children }: { children: React.ReactNode }) => {
    
    const [salesOrders, setSalesOrders] = useState<salesOrdersType[]>([]);
    const { user } = useUser();

    const loadSalesOrders = async () => {
        if (!user?.id) return;

        try {
            const response = await axios.get(`${api_url}/shipment/list`);
            const res = response.data;
            const data = Array.isArray(res) ? res : (res.response || []);

            const hasPermission = Number(user.departments_id) === -1 || Number(user.departments_id) === 12;

            setSalesOrders(hasPermission ? data : []);

        } catch (err) {
            console.error('Erro ao carregar expedição:', err);
        }
    };

    useEffect(() => {
        loadSalesOrders();
    }, [user?.id]);

    return (
        <SalesOrdersContext.Provider value={{ salesOrders, loadSalesOrders }}>
            {children}
        </SalesOrdersContext.Provider>
    );
};

export const useSalesOrders = () => useContext(SalesOrdersContext);