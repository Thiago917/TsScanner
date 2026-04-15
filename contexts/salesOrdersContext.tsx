import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
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
    items_sum_quantity: number;
    items_sum_separated: number;
    items: salesOrdersItems[];
}
type salesOrdersContextData = {
    salesOrders: salesOrdersType[]; 
    loadSalesOrders: () => Promise<void>;
}

export const SalesOrdersContext = createContext<salesOrdersContextData>({} as salesOrdersContextData);

const api_url = process.env.EXPO_PUBLIC_API_URL;

export const SalesOrdersProvider = ({ children }: { children: React.ReactNode }) => {

    const [salesOrders, setSalesOrders] = useState<salesOrdersType[]>([]);
    const { user } = useUser();

    const loadSalesOrders = async () => {

        if (!user) return;

        try {
            const response = await axios.get(`${api_url}/shipment/list`);
            const res = response.data;
            if (res.error) {
                Alert.alert('Erro', `Erro ao carregar pedidos... ${res.message}`);
                return;
            }

            const hasPermission = user.departments_id === -1 || user.departments_id === 12;
            setSalesOrders(hasPermission ? res.response : []);

        } catch (err) {
            Alert.alert('Erro', `Erro ao carregar pedidos... ${err}`);
        }
    };

    useEffect(() => {
        loadSalesOrders();
    }, [user]); 

    return (
        <SalesOrdersContext.Provider value={{ salesOrders, loadSalesOrders }}>
            {children}
        </SalesOrdersContext.Provider>
    );
};

export const useSalesOrders = () => useContext(SalesOrdersContext); 