import { useOrders } from '@/contexts/ProductionOrdersContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const api_url = process.env.EXPO_PUBLIC_API_URL;

export default function WarehouseBip() {
  const inputRef = useRef<TextInput | null>(null);
  const { productionOrder } = useLocalSearchParams<{ productionOrder: string }>();

  const [items, setItems] = useState<any[]>([]); // Inicializado como array
  const [current, setCurrent] = useState<any>({}); // Inicializado como objeto
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempQty, setTempQty] = useState<string>('');
  const {setOrders, orders} = useOrders()

  useEffect(() => {
    loadData();
  }, []);

  const getDate = async (now: Date) => {
    const mysqlDateTime = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
    return mysqlDateTime;        
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const opDetails = orders.find((o) => !o.isReq ? String(o.order_code) === String(productionOrder) : String(o.id) === String(productionOrder));
      if (!opDetails) {
        Alert.alert('Erro', `O.P ${productionOrder} não encontrada ou não atribuída a você.`, [
          { text: 'Ok', onPress: () => router.replace('/warehouse') }
        ]);
        return;
      }

      setCurrent(opDetails);
      const formattedItems = opDetails.items.map((item: any) => ({
        ...item,
        picked: Number(item.separated) || 0, 
      }));

      formattedItems
      setItems(formattedItems);

      var orderId = !opDetails.isReq ? opDetails.order_code : `REQ-${opDetails.id}`; 
      const now = await getDate(new Date());

      if(opDetails.status === 1){
        setOrders(orderId, { "status": 2, "separating_at": now });
      }

      const allItemsPicked = formattedItems.every((item: any) => Number(item.picked) >= Number(item.quantity));
      setSubmitting(!allItemsPicked); 

    } catch (err) {
        Alert.alert('Erro', `Erro ao carregar itens da O.P ${productionOrder}`);
        console.error("Erro ao carregar dados da O.P:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleBarcodeInput = (text: string) => {
    if (text.length === 0 || !items || items.length === 0) return;

    const itemIndex = items.findIndex((item: any) =>
      String(item.product_code).toLowerCase() === text.toLowerCase()
    );

    if (itemIndex === -1) {
      Alert.alert('Aviso', `Item ${text} não encontrado nesta O.P.`, [
        { text: 'Ok', onPress: () => { setInputValue(''); inputRef.current?.focus(); } }
      ]);
      return;
    }

    setItems(prevItems => {
      const updated = [...prevItems];
      const itemToUpdate = updated[itemIndex];

      updated[itemIndex].picked = Number(itemToUpdate.quantity) || 0;

      if (Number(itemToUpdate.picked) > Number(itemToUpdate.quantity)) {
        // itemToUpdate.picked = Number(itemToUpdate.picked) + 1;
      // } else {
        Alert.alert('Aviso', `Quantidade máxima do item ${itemToUpdate.product_code} já atingida.`);
      }

      const allItemsPicked = updated.every(item => Number(item.picked) >= Number(item.quantity));
      setSubmitting(!allItemsPicked);
      return updated;
    });

    setInputValue('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const sendData = async () => {
    setChecking(true);

    try {
      const data = {
        op: !current.isReq ? productionOrder : `REQ-${current.id}`,
        items: items.map((item: any) => ({
          product_code: item.product_code, 
          picked: item.picked
        }))
      }

      const response = await axios.post(`${api_url}/warehouse/separation`, data);
      const res = response.data;

      if (res.error) {
        Alert.alert('Erro', `${res.message}`)
        return;
      }

      Alert.alert('Sucesso', 'Pedido enviado para conferência.')
      router.replace('/warehouse')

      const now = await getDate(new Date());
      setOrders(productionOrder, { "status": 7, "checked_at": now });

    } catch (err) {
      Alert.alert('Erro', `Erro no envio da separação para a conferência | ${err}`)
      console.error("Erro ao enviar dados da separação:", err);
    }
    finally{
      setChecking(false);
    }
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setTempQty(String(items[index].picked));
    setIsModalVisible(true); // Abre o modal
  };

  const saveEditedQuantity = () => {
    if (editingIndex !== null) {
      const updated = [...items];
      const item = updated[editingIndex];
      const val = Number(tempQty);
      
      item.picked = isNaN(val) ? 0 : val;

      const isExcpetionFamily = item.family === '50021' || item.family === '50001';

      if(!isExcpetionFamily && Number(item.picked) > item.quantity) {
        item.picked = item.quantity;
      }
      
      setItems(updated);
      const allItemsPicked = updated.every(i => Number(i.picked) >= Number(i.quantity));
      setSubmitting(!allItemsPicked);
    }
    
    setIsModalVisible(false);
    setEditingIndex(null);
  };
  
  const renderItem = ({ item, index }: { item: any; index: number }) => { 
  const percentage = Number(item.quantity) > 0 ? ((Number(item.separated) / Number(item.quantity)) * 100).toFixed(0) : 0;
  const isItemDisabled = Number(item.picked) === 0; 

  return (

    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={styles.bold}>{item.product_code}</Text>
        <Text style={{ color: Number(percentage) >= 100 ? '#0abb87' : '#666' }}>
          {percentage}%
        </Text>
      </View>

      <View style={styles.cell}>
        <Text style={{ fontSize: 12, color: '#3b3b57' }}>Local: {item.place}</Text>
        <Text>Qtd: {Number(item.picked).toFixed(0)} / {Number(item.quantity).toFixed(0)}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.cell, { alignItems: 'flex-end' }]} 
        onPress={() => openEditModal(index)} 
        disabled={isItemDisabled}
      >
        <View style={[styles.editButton, isItemDisabled && { opacity: 0.5 }]}>
          <Ionicons name="create-outline" size={20} color="#3b3b57" />
          <Text style={styles.editText}>Editar</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  };
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b3b57" />
        <Text>Carregando itens da O.P...</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <TextInput autoFocus ref={inputRef} style={styles.hiddenInput} value={inputValue} showSoftInputOnFocus={false} onBlur={() => setTimeout(() => inputRef.current?.focus(), 50)} onChangeText={handleBarcodeInput} />

      <Text style={styles.h1}>
        O.P: <Text style={{ color: '#0abb87' }}>#{!current.isReq ? productionOrder : `REQ-${productionOrder}`}</Text>
      </Text>

      <FlatList
        data={items} 
        keyExtractor={(item) => String(item.id)} 
        renderItem={renderItem}
        ListFooterComponent={() => (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.submitButton, submitting && styles.disabledButton]} onPress={sendData} disabled={submitting}>
              {checking ? (
                <ActivityIndicator color={'#fff'} />
              ) : (
                <Text style={styles.submitText}>Mandar para Conferência</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Quantidade</Text>
            <Text style={styles.modalSubtitle}>Item: {editingIndex !== null ? items[editingIndex].product_code : ''}</Text>
            
            <TextInput style={styles.modalInput} keyboardType="numeric" value={tempQty} onChangeText={setTempQty} autoFocus/>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveEditedQuantity}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  h1: {
    fontSize: 20,
    textAlign: 'center',
    paddingVertical: 20,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#e8e8e8',
    marginHorizontal: 15, 
    borderRadius: 8, 
    marginBottom: 8, 
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  buttonContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#3b3b57',
    width: '90%', 
    padding: 15,
    borderRadius: 8,
    elevation: 3, 
  },
  submitText: {
    fontWeight: 'bold',
    color: 'ghostwhite',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ddd',
    padding: 6,
    borderRadius: 5,
  },
  editText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
    color: '#3b3b57',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#3b3b57',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4d4d',
  },
  cancelButtonText: {
    color: '#ff4d4d',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b3b57',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});