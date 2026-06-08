import { useSalesOrders } from '@/contexts/salesOrdersContext';
import Slider from '@react-native-community/slider';
import { HeaderBackButton } from '@react-navigation/elements';
import axios from "axios";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const api_url = process.env.EXPO_PUBLIC_API_URL

export default function Bip() {

  const router = useRouter();
  const navigation = useNavigation();
  const inputRef = useRef<TextInput | null>(null);
  const { salesOrders, updateSalesOrders } = useSalesOrders();

  const { order} = useLocalSearchParams<{ order: string; }>();

  const [ns, setNs] = useState<Record<string, string>>({});
  const [items, setItems] = useState<any[]>([]);
  const [serials, setSerials] = useState<any[]>([]);
  const [eans, setEans] = useState<any[]>([]);
  const [orderID, setOrderID] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [bipedAmount, setBipedAmount] = useState(false)
  const [split, setSplit] = useState(true);
  const [countAmount, setCountAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
      loadData();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: (props: any) => (
        <HeaderBackButton {...props} onPress={handleBackAttempt} />
      ),
    });

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackAttempt
    );

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  const handleBackAttempt = (): boolean => {
    Alert.alert('Aviso de Saída', 'Você tem certeza que deseja sair?', [
      {
        text: 'Continuar Separando', style: 'cancel', onPress: () => {}
      },
      {
        text: 'Sair', style: 'destructive', onPress: () => {router.back()}
      }
    ])
    return true;
  }

  useEffect(() => {
    
    const ns_registered = serials.map((item) => item.serial_number);
    const bipped = Object.values(ns).map(item => item.split(',')).flat().length + ns_registered.length
    if(bipped > 0 && Number(countAmount) === Number(bipped)){
      setSplit(false)
      setBipedAmount(true)
    }

  }, [ns])

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
    setLoadingData(true);
    try {
      const saleOrder = salesOrders.find(
        (so) => String(so.order_code) === String(order) || String(so.id) === String(order)
      );

      if (!saleOrder || !saleOrder.items) {
        Alert.alert(
          'Erro',
          `Pedido ${order} não encontrado ou não atribuído a você.`,
          [{ text: 'Ok', onPress: () => router.replace('/shipment') }]
        );
        return;
      }

      setItems(saleOrder.items);
      setOrderID(String(saleOrder.id));
      
      setEans(saleOrder.items.map((item: any) => item.code));

      const total = saleOrder.items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity),
        0
      );
      setCountAmount(total);

      const allSerials = saleOrder.items.flatMap((item: any) => item.serials || []);
      setSerials(allSerials);
      if(saleOrder.separating_at === null){
        const now = await getDate(new Date())
        await updateSalesOrders(order, {"separating_at": now})
      }

    } catch (err) {
      Alert.alert(
        'Erro',
        `Aconteceu um problema ao carregar itens do pedido ${order}...`,
        [{ text: 'Ok', onPress: () => inputRef.current?.focus() }]
      );
    } finally {
      setLoadingData(false); 
    }
  };

  const confirmEAN = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Confirmação',
        message,
        [
          {
            text: 'NÃO',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'SIM',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: false }
      );
    });
  };

  const handleSerialInput = async (text: string) => {
    setIsProcessing(true);

    try {
      if (text.length === 12) {
        const arr = text.split('');
        arr.splice(5, 0, '0');
        text = arr.join('');
      }

      if (text.length !== 13 && text.length !== 12) {
        setIsProcessing(false);
        return;
      }

      const ns_rec  = serials.map((item) => item.serial_number) 
      
      const codes = items.map((item) => (
      {
        
        product_code:
          item.product_code.length === 3
            ? `0${item.product_code}`
            : `${item.product_code}`,
        product_id: item.product_id,
        quantity: Number(item.quantity),
        separated: Number(item.separated),
        collective_box: item.in_box === null || !item.in_box ? 1 : Number(item.in_box.collective_box),
        ean: item.code.ean_dv
      }));

      let checkProd = '';

      if (text.startsWith('789')) {
        const found = codes.find(item => String(item.ean) === text);
        checkProd = found ? found.product_code : '';
      } else {
        checkProd = text.slice(5, 9);
      }

      var product = codes.find((item) => item.product_code === checkProd || text === item.ean);
      const find_duplicate = ns_rec.find((item) => item === text)
      const find_eans = eans.find((item) => String(item.ean_dv)  === String(text))

      if (!product && checkProd.endsWith('0')) {
        
        var checkVal = `0${checkProd.slice(0, 3)}`
        product = codes.find((item) => item.product_code === checkVal || text === item.ean);
        if(product){
          checkProd = checkVal
        }
      }

      if(!product){
        Alert.alert('Erro', `Você bipou o produto errado: ${checkProd}! Produto ${checkProd} Não existe no pedido`, [{
          text: 'Ok',
          onPress: () => inputRef.current?.focus()
        }])
        setIsProcessing(false);
        return;
      }
      
      const { product_id, quantity, separated, collective_box } = product;

      if(text.slice(0, 3) === '789'){
        const ok = await confirmEAN(
        `Você bipou o EAN do item ${checkProd}, está correto?`
        );

        if(!ok){
        setInputValue('');
        inputRef.current?.focus()
        setIsProcessing(false);
        return;
        }
      }

      setInputValue('');

      setNs((prev) => {
        const atual = prev[product_id] || '';
        const nsArray = atual.split(',').filter(Boolean);
        const actualList = [...nsArray];

        if (!text.includes('C') && nsArray.includes(text) && text.slice(0, 3) !== '789') {
          Alert.alert('Aviso', `O número de série já foi bipado: ${text}`, [{
            text: 'Ok',
            onPress: () => inputRef.current?.focus()
          }]);
          setIsProcessing(false);
          return prev;
        }

        if (text.includes('C')) {
          const boxIndex = Number(text.slice(-3));
          const boxSize = Number(collective_box);

          const begin = (boxIndex - 1) * boxSize + 1; 
          const theoric = boxIndex * boxSize;
          
          const end = Math.min(theoric, quantity); 
          const base = text.split('C')[0];

          for (let i = begin; i <= end; i++) {
            const sn = `${base}${String(i).padStart(4, '0')}`;

            const find1 = actualList.includes(sn);
            const find2 = ns_rec.includes(sn);

            if (find1 || find2) {
              Alert.alert('Aviso', `A caixa contém o número de série ${sn} que já foi bipado anteriormente!`, [
                { text: 'Ok', onPress: () => inputRef.current?.focus() },
              ]);
              setIsProcessing(false);
              return prev;
            }

            actualList.push(sn);
          }
        } 
        else {

          if (find_duplicate && text.slice(0, 3) != '789') {
            Alert.alert('Aviso', `O número de série ${text} já foi bipado...`, [{
              text: 'Ok',
              onPress: () => inputRef.current?.focus()
            }]);
            setIsProcessing(false);
            return prev;
          }
          actualList.push(text);
        }
        
        if (text.slice(0, 3) === '789' && !find_eans) {
          Alert.alert('Aviso', `EAN do item ${checkProd} não foi encontrado.`, [{
            text: 'Ok',
            onPress: () => inputRef.current?.focus()
          }]);
          setIsProcessing(false);
          return prev;
        }

        if (separated >= quantity) {
          Alert.alert('Aviso', `Bipando o item ${checkProd} a mais do que o necessário!`, [{
            text: 'Ok',
            onPress: () => inputRef.current?.focus()
          }]);
          setIsProcessing(false);
          return prev;
        }

        const novo = actualList.join(',');

        setItems((prev) =>
          prev.map((p) =>{
            if(p.product_id !== product_id) return p;

            const step = text.includes('C') ? (Number(collective_box) || 1) : 1

            return{
              ...p,
              separated: Math.min(Number(p.separated) + step, quantity)
            }

          })
        );

        return { ...prev, [product_id]: novo };
      });

      setTimeout(() => {
        inputRef.current?.focus();
        setIsProcessing(false);
      }, 50);
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  const sendData = async () => {
    setLoading(true)
    if(Object.values(ns).map(item => item.split(',')).flat().length == 0){
      setLoading(false)
      Alert.alert('Erro','Não é possível gravar sem bipar nenhum item!', [{
        text: 'Ok',
        onPress: () => inputRef.current?.focus()
      }])
      return;
    }
    try{

      const data = {
        "order": orderID,
        "barcodes": Object.values(ns).map(item => item.split(',')).flat()  
      }

      const response = await axios.post(`${api_url}/shipment/ns-register`, data)
      const res = response.data;

        if(res.error){
          return Alert.alert('Erro', `${res.message}`)
        }

        if(res.response_id == '2'){
          
          Alert.alert('Sucesso!','Pedido separado com sucesso! ✅', [{
            text: 'Ok',
            onPress: () => inputRef.current?.focus()
          }]);
          
          setLoading(false)
          setTimeout(() => {
            router.replace('/shipment')
          }, 1500)
      }
      else{
        setLoading(false)
        Alert.alert('Sucesso!','Informações de separação enviadas!', [{
          text: 'Ok',
          onPress: () => inputRef.current?.focus()
        }]);
        router.replace(`/shipment/bip/${order}`)
      }
    }
    catch(err){
      setLoading(false)
      Alert.alert('Erro',`Aconteceu um problema ao enviar dados de separação: ${err}`, [{
        text: 'Ok',
        onPress: () => inputRef.current?.focus()
      }])
    }
  }

  const splitOrder = () => {
    Alert.alert('Confirmação', 'Confirma que o pedido é parcial?', [{
      text: 'SIM',
      onPress: (() => {
        setBipedAmount(true)
        setSplit(false)
      })
    },{
      text: 'NÃO'
    }])
  } 

  if(loadingData){
    return(
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator color={process.env.EXPO_PUBLIC_MAIN_COLOR}/>
      </View>
    )
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>

      {/* PRODUTO */}
      <View style={styles.cell}>
        <Text style={styles.bold}>{item.product_code}</Text>
          {(item.description && item.description.length >= 22) ? (
            <>
                <TouchableOpacity onPress={() => Alert.alert('Descrição', item.description)}>
                  <Text style={{fontSize: 10, color: '#666', flex: 1}} numberOfLines={1} ellipsizeMode="tail">{item.description}</Text>
                </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{fontSize: 10, color: '#666', flex: 1}} numberOfLines={1} ellipsizeMode="tail">{item.description}</Text>
            </>
          )}
        <Text>
          {item.quantity > 0 ? ((Number(item.separated) / Number(item.quantity)) * 100).toFixed(0) : 0}%
        </Text>
      </View>

      {/* LOCAL NO ESTOQUE */}
      <View style={styles.cell}>
        <Text style={{ fontSize: 12, color: '#3b3b57' }}>Local: {item.place}</Text>
        <Text>Total: {Number(item.quantity).toFixed(0)}</Text>
      </View>

      {/* SLIDER INDICATIVO */}
      <View style={styles.cell}>
        <Slider 
          minimumValue={0}
          maximumValue={Number(item.quantity)}
          value={Number(item.separated)}
          step={1}
          disabled={true}
          thumbTintColor={
            Number(item.separated) > 0 && Number(item.separated) < Number(item.quantity) ? '#646c9a' : Number(item.separated) >= Number(item.quantity) ? '#0abb87' : '#d3d3d3'
          }
          minimumTrackTintColor={
            Number(item.separated) > 0 && Number(item.separated) < Number(item.quantity) ? '#646c9a' : '#d3d3d3'
          }
          maximumTrackTintColor='black'
        />
        <Text style={{ textAlign: 'center', marginTop: 4, fontSize: 11 }}>Separado: {Number(item.separated).toFixed(0)}</Text>
      </View>
    </View>
  );
 
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <TextInput
        autoFocus
        ref={inputRef}
        style={styles.hiddenInput}
        value={inputValue}
        placeholder='Serial'
        showSoftInputOnFocus={false}
        onBlur={() => {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 50);
        }}
        onChangeText={(text) => handleSerialInput(text)}

      />
      <Text style={styles.h1}>
           SEPARAÇÃO: <Text style={{ color: '#0abb87' }}>#{order}  </Text>({countAmount})
      </Text>
      {split ? (
      <TouchableOpacity style={styles.splitButton} onPress={splitOrder}>
          <Text style={{fontWeight: 'bold', textAlign: 'center', color: 'ghostwhite', fontSize: 12}}>Parcial?</Text>
      </TouchableOpacity>

      ): (<></>)}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListFooterComponent={() => (
            <View style={styles.buttonContainer}>
              {bipedAmount ? (
                <TouchableOpacity style={styles.submitButton} onPress={sendData} disabled={loading}>
                  {loading? (
                    <ActivityIndicator color={'#fff'} />
                  ):(
                    <Text style={styles.submitText}>Enviar dados</Text>
                  )
                  }
                </TouchableOpacity>
               ):( 
                   <></> 
               )} 
            </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 6,
    width: '100%',
    borderRadius: 4,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  inputDisabled: {
    backgroundColor: '#ddd',
    color: '#666',
  },
  hiddenInput:{
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0
  },
  buttonContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#3b3b57',
    width: '60%',
    padding: 12,
    borderRadius: 6,
  },
  splitButton:{
    backgroundColor: '#5e5e7d',
    width: '30%',
    padding: 5,
    borderRadius: 6,
    margin: 5
  },
  submitText: {
    fontWeight: 'bold',
    color: 'ghostwhite',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.4
  }
});