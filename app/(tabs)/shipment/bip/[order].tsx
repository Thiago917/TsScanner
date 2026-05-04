import Slider from '@react-native-community/slider';
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const api_url = process.env.EXPO_PUBLIC_API_URL
export default function Bip() {

  const router = useRouter();
  const inputRef = useRef<TextInput | null>(null);

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
  
  useEffect(() => {
    loadData()
  }, []);

  useEffect(() => {
    
    const ns_registered = serials.map((item) => item.serial_number);
    const bipped = Object.values(ns).map(item => item.split(',')).flat().length + ns_registered.length
    
    if(bipped > 0 && Number(countAmount) === Number(bipped)){
      setSplit(false)
      setBipedAmount(true)
    }

  }, [ns])

  const loadData = async () => {
    setLoadingData(true);
    try {
      const response = await axios.post(`${api_url}/shipment/separation-details/${order}`);
      
      const itemsFromApi = response.data.response.items;

      setItems(itemsFromApi);
      setOrderID(response.data.response.id);
      setSerials(response.data.ns);
      setEans(itemsFromApi.map((item: any) => item.code));

      const total = itemsFromApi.reduce(
        (sum: number, item: any) => sum + Number(item.quantity),
        0
      );
      setCountAmount(total);
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
    
    if (text.length === 12) {
      const arr = text.split('');
      arr.splice(5, 0, '0');
      text = arr.join('');
    }

    if (text.length !== 13 && text.length !== 12) return;

    const ns_rec  = serials.map((item) => item.serial_number) 

    const codes = items.map((item) => ({
      product_code:
        item.product_code.length === 3
          ? `0${item.product_code}`
          : `${item.product_code}`,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      separated: Number(item.separated),
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
      return;
    }
    
    const { product_id, quantity, separated } = product;

    if(text.slice(0, 3) === '789'){
      const ok = await confirmEAN(
      `Você bipou o EAN do item ${checkProd}, está correto?`
      );

      if(!ok){
      setInputValue('');
      inputRef.current?.focus()
      return;
      }
    }
    setInputValue('');

    setNs((prev) => {
      const atual = prev[product_id] || '';
      const nsArray = atual.split(',').filter(Boolean);

      if(text.slice(0, 3) === '789' && !find_eans){
        Alert.alert('Aviso', `EAN do item ${checkProd} não foi encontrado.`, [{
          text: 'Ok',
          onPress: () => inputRef.current?.focus()
        }]);
        return prev;
      }

      if(find_duplicate && text.slice(0, 3) != '789'){
        Alert.alert('Aviso',`O número de série ${text} já foi bipado...`, [{
        text: 'Ok',
        onPress: () => inputRef.current?.focus()
      }]);
        return prev;
      }

      if(separated >= quantity){
        Alert.alert('Aviso',`Bipando o item ${checkProd} a mais do que o necessário!`, [{
          text: 'Ok',
          onPress: () => inputRef.current?.focus()
        }]);
        return prev;
      }

      if (nsArray.includes(text) && text.slice(0, 3) !== '789') {
        Alert.alert('Aviso',`O número de série já foi bipado: ${text}`, [{
          text: 'Ok',
          onPress: () => inputRef.current?.focus()
        }]);
        return prev;
      }

      const novo = [...nsArray, text].join(',');

      setItems((prev) =>
        prev.map((p) =>
          p.product_id === product_id
            ? { ...p, separated: (Number(p.separated) + 1).toString() }
            : p
        )
      );

      return { ...prev, [product_id]: novo };
    });

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

  };

  const sendData = () => {
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
      axios.post(`${api_url}/shipment/ns-register`, {
        'order': orderID,
        'barcodes': Object.values(ns).map(item => item.split(',')).flat() 
      }).then((response) => {
        const res = response.data;
        if(res.response_id == '2'){
          setLoading(false)
          Alert.alert('Sucesso!','Pedido separado com sucesso! ✅', [{
            text: 'Ok',
            onPress: () => inputRef.current?.focus()
          }]);
          
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
    })
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
        <Text>
          {item.quantity > 0 ? ((Number(item.separated) / Number(item.quantity)) * 100).toFixed(0) : 0}%
        </Text>
      </View>

      {/* QUANTIDADE */}
      <View style={styles.cell}>
        <Text>Total: {Number(item.quantity).toFixed(0)}</Text>
        <Text>Separado: {Number(item.separated).toFixed(0)}</Text>
      </View>

      {/* SEPARAR */}
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