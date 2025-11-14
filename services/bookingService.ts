import type { Bookings } from '../types';

// Para este aplicativo com fins educacionais, usaremos o `localStorage` do 
// navegador como nosso banco de dados. Ele permite que os dados persistam
// (não sejam perdidos) quando a página é recarregada no mesmo navegador.
//
// Limitação: O localStorage é específico para cada navegador e dispositivo. 
// Agendamentos feitos em um navegador não aparecerão em outro. Para isso,
// uma API e um banco de dados real (como MongoDB) seriam necessários.

const LOCAL_STORAGE_KEY = 'nubiaAlvesBookings';

// Helper para obter a data formatada
function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Dados iniciais para popular o app na primeira vez que ele é aberto.
const initialBookings: Bookings = {
  [getFormattedDate(new Date(Date.now() + 86400000 * 2))]: { // Daqui a 2 dias
    "10:30": { clientName: "Ana" },
    "17:00": { clientName: "Carla" },
  },
  [getFormattedDate(new Date(Date.now() + 86400000 * 5))]: { // Daqui a 5 dias
    "09:00": { clientName: "Sofia" },
  }
};

// Carrega os agendamentos do localStorage. Se não houver, usa os dados iniciais.
const loadBookings = (): Bookings => {
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Falha ao carregar dados do localStorage:", error);
  }
  // Se não houver dados, salva os dados iniciais e os retorna.
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialBookings));
  return initialBookings;
};

// Salva o objeto completo de agendamentos no localStorage.
const persistBookings = (bookingsToSave: Bookings) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookingsToSave));
  } catch (error) {
    console.error("Falha ao salvar dados no localStorage:", error);
  }
};


// --- Implementação do Serviço para o Frontend ---

// "listener" é a função (o `setBookings` do React) que será chamada para atualizar a UI.
let listener: ((data: Bookings) => void) | null = null;

/**
 * Inicia a "escuta" por agendamentos.
 * A função de callback fornecida será chamada imediatamente com os dados
 * atuais e sempre que os dados forem atualizados.
 * @param callback A função para ser chamada com os dados dos agendamentos.
 * @returns Uma função para parar de escutar (unsubscribe).
 */
export function listenToBookings(callback: (data: Bookings) => void): () => void {
  listener = callback;
  
  // Envia os dados iniciais para a UI assim que ela começa a escutar.
  const initialData = loadBookings();
  listener(initialData);

  // Retorna a função "unsubscribe" para limpar o listener quando o componente desmontar.
  return () => {
    listener = null;
  };
}

/**
 * Salva um novo agendamento, persiste os dados e notifica a UI sobre a mudança.
 * @param dateString A data no formato 'YYYY-MM-DD'.
 * @param slot O horário, ex: "09:00".
 * @param clientName O nome do cliente.
 */
export async function saveBooking(dateString: string, slot: string, clientName: string): Promise<void> {
  // Simula um pequeno atraso, como se estivesse salvando em um servidor.
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const currentBookings = loadBookings();
  
  const updatedBookings = {
    ...currentBookings,
    [dateString]: {
      ...currentBookings[dateString],
      [slot]: { clientName },
    },
  };

  persistBookings(updatedBookings);

  // Notifica a UI (via listener) que os dados mudaram, para que ela possa re-renderizar.
  if (listener) {
    listener(updatedBookings);
  }

  console.log(`Agendamento salvo para ${clientName} em ${dateString} às ${slot}`);
}
