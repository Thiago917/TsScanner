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
    items_sum_quantity: string | number | null; // Banco retorna como string ou null
    items_sum_separated: string | number | null;
    items: salesOrdersItems[];
}

type salesOrdersContextData = {
    salesOrders: salesOrdersType[];
    loadSalesOrders: () => Promise<void>;
}

// Valor padrão seguro para evitar erros de "undefined" nos componentes
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

            // No seu log, 'res' já é o array direto.
            // Se o seu backend mudar para { response: [...] }, ajuste aqui.
            const data = Array.isArray(res) ? res : (res.response || []);

            // Permissão: Admin (-1) ou Expedição (12)
            const hasPermission = Number(user.departments_id) === -1 || Number(user.departments_id) === 12;

            setSalesOrders(hasPermission ? data : []);

        } catch (err) {
            console.error('Erro ao carregar expedição:', err);
            // Alert.alert('Erro', `Falha na conexão com servidor.`);
        }
    };

    useEffect(() => {
        loadSalesOrders();
    }, [user?.id]); // Recarrega apenas se o usuário mudar

    return (
        <SalesOrdersContext.Provider value={{ salesOrders, loadSalesOrders }}>
            {children}
        </SalesOrdersContext.Provider>
    );
};

export const useSalesOrders = () => useContext(SalesOrdersContext);