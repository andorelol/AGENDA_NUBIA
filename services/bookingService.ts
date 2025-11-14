import type { Bookings } from '../types';

// --- ARQUITETURA DE DADOS: O DESAFIO DA PERSISTÊNCIA MULTIUSUÁRIO ---
//
// OBJETIVO: Fazer com que os agendamentos sejam salvos e visíveis para QUALQUER
// usuário que acesse o link, não importa o dispositivo.
//
// PROBLEMA: A web, por padrão, não tem um "disco rígido" compartilhado.
// O `localStorage` é a solução mais próxima, mas funciona como um cofre
// individual para cada navegador. O agendamento do Usuário A fica salvo no
// cofre do navegador dele, e o Usuário B não tem acesso.
//
// SOLUÇÃO REAL: Para compartilhar dados, precisamos de um servidor central
// (um banco de dados na nuvem) que todos os usuários possam acessar.
// Serviços como Firebase (Firestore) ou Supabase são perfeitos para isso.
//
// O QUE FAREMOS AQUI: Como não podemos instalar um banco de dados externo
// neste ambiente, vamos manter o `localStorage` para simular a persistência
// para um único usuário e adicionar comentários claros mostrando onde o código
// de um banco de dados real entraria.

const LOCAL_STORAGE_KEY = 'nubiaAlvesBookings';

// Helper para obter a data formatada
function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Dados iniciais - usados apenas se o localStorage estiver vazio
const initialBookings: Bookings = {
  [getFormattedDate(new Date(Date.now() + 86400000 * 2))]: { // Daqui a 2 dias
    "10:30": { clientName: "Ana" },
    "17:00": { clientName: "Carla" },
  },
  [getFormattedDate(new Date(Date.now() + 86400000 * 5))]: { // Daqui a 5 dias
    "09:00": { clientName: "Sofia" },
  }
};

// --- Lógica de Persistência (Simulada com localStorage) ---

const loadBookings = (): Bookings => {
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Falha ao carregar agendamentos do localStorage:", error);
  }
  // Se não houver nada salvo, usa os dados iniciais
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialBookings));
  return initialBookings;
};

const persistBookings = (bookingsToSave: Bookings) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookingsToSave));
  } catch (error) {
    console.error("Falha ao salvar agendamentos no localStorage:", error);
  }
};

// --- Implementação do Serviço ---

let bookings: Bookings = loadBookings();
let listener: ((data: Bookings) => void) | null = null;


// Simula um listener em tempo real (como o onSnapshot do Firebase)
export function listenToBookings(callback: (data: Bookings) => void): () => void {
  listener = callback;
  // Envia imediatamente os dados atuais carregados do localStorage
  listener(bookings);

  // **************************************************************************
  // NOTA PARA O MUNDO REAL:
  // Aqui você iniciaria o listener do seu banco de dados. Exemplo com Firebase:
  //
  // import { db } from './firebaseConfig';
  // import { onSnapshot, collection } from 'firebase/firestore';
  //
  // const unsubscribe = onSnapshot(collection(db, "bookings"), (snapshot) => {
  //   const serverBookings = {}; // Mapeia o snapshot para o formato `Bookings`
  //   snapshot.docs.forEach(doc => { ... });
  //   listener(serverBookings);
  // });
  // return unsubscribe; // Retorna a função para parar de ouvir
  // **************************************************************************


  // Retorna uma função "unsubscribe" para a nossa simulação
  return () => {
    listener = null;
  };
}

// Simula o salvamento de um agendamento no banco de dados
export async function saveBooking(dateString: string, slot: string, clientName: string): Promise<void> {
  // Simula o atraso da rede
  await new Promise(resolve => setTimeout(resolve, 1000));

  // **************************************************************************
  // NOTA PARA O MUNDO REAL:
  // Aqui você faria a chamada para salvar os dados no banco de dados. Exemplo com Firebase:
  //
  // import { db } from './firebaseConfig';
  // import { doc, setDoc } from 'firebase/firestore';
  //
  // const bookingRef = doc(db, 'bookings', dateString);
  // await setDoc(bookingRef, { [slot]: { clientName } }, { merge: true });
  //
  // O listener (onSnapshot) se encarregaria de atualizar a UI automaticamente,
  // então as linhas abaixo não seriam estritamente necessárias.
  // **************************************************************************

  // Lógica de atualização para nossa simulação com localStorage
  const updatedBookings = { ...bookings };
  if (!updatedBookings[dateString]) {
    updatedBookings[dateString] = {};
  }
  
  updatedBookings[dateString][slot] = { clientName };

  // Atualiza o estado em memória e persiste no localStorage
  bookings = updatedBookings;
  persistBookings(bookings);

  // Notifica o listener da mudança (simulando a reatividade do backend)
  if (listener) {
    listener({ ...bookings });
  }

  console.log(`Agendamento salvo para ${clientName} em ${dateString} às ${slot}`);
}