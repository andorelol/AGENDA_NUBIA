import type { Bookings } from '../types';

// Usaremos o `localStorage` como um "quadro de avisos" compartilhado.
// A lógica abaixo garante que, quando uma aba atualiza o quadro,
// todas as outras abas sejam notificadas e atualizem sua visualização.
// Isso simula um banco de dados em tempo real para múltiplos usuários
// (desde que estejam usando o mesmo navegador).

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

let listenerCallback: ((data: Bookings) => void) | null = null;

/**
 * Inicia a escuta por agendamentos, incluindo atualizações de outras abas.
 * @param callback A função para ser chamada com os dados dos agendamentos.
 * @returns Uma função para parar de escutar (unsubscribe).
 */
export function listenToBookings(callback: (data: Bookings) => void): () => void {
  listenerCallback = callback;
  
  // O "sino" que avisa sobre mudanças no "quadro de avisos" (localStorage).
  // Este evento é disparado em todas as outras abas, exceto a que fez a alteração.
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_KEY && event.newValue && listenerCallback) {
      console.log('Dados sincronizados de outra aba!');
      listenerCallback(JSON.parse(event.newValue));
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Envia os dados iniciais para a UI assim que ela começa a escutar.
  const initialData = loadBookings();
  listenerCallback(initialData);

  // Retorna a função "unsubscribe" para limpar o listener.
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    listenerCallback = null;
  };
}

/**
 * Salva um novo agendamento, persistindo os dados e notificando a UI local.
 * A persistência no localStorage irá acionar o evento 'storage' para outras abas.
 * @param dateString A data no formato 'YYYY-MM-DD'.
 * @param slot O horário, ex: "09:00".
 * @param clientName O nome do cliente.
 */
export async function saveBooking(dateString: string, slot: string, clientName: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const currentBookings = loadBookings();
  
  const updatedBookings = {
    ...currentBookings,
    [dateString]: {
      ...currentBookings[dateString],
      [slot]: { clientName },
    },
  };

  // 1. Escreve no "quadro de avisos". Isso irá notificar as outras abas.
  persistBookings(updatedBookings);

  // 2. Notifica a aba ATUAL sobre a mudança, pois o evento 'storage' não
  // é disparado na mesma aba que o originou.
  if (listenerCallback) {
    listenerCallback(updatedBookings);
  }

  console.log(`Agendamento salvo para ${clientName} em ${dateString} às ${slot}`);
}
