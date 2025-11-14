
import type { Bookings } from '../types';

const LOCAL_STORAGE_KEY = 'nubiaAlvesBookings';

// Helper to get formatted date
function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial mock data - used only if localStorage is empty
const initialBookings: Bookings = {
  [getFormattedDate(new Date(Date.now() + 86400000 * 2))]: { // 2 days from now
    "10:30": { clientName: "Ana" },
    "17:00": { clientName: "Carla" },
  },
  [getFormattedDate(new Date(Date.now() + 86400000 * 5))]: { // 5 days from now
    "09:00": { clientName: "Sofia" },
  }
};

// --- Data Persistence Logic ---

const loadBookings = (): Bookings => {
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Failed to parse bookings from localStorage:", error);
  }
  // If nothing is stored or parsing fails, set initial data
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialBookings));
  return initialBookings;
};

const persistBookings = (bookingsToSave: Bookings) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookingsToSave));
  } catch (error) {
    console.error("Failed to save bookings to localStorage:", error);
  }
};

// --- Service Implementation ---

let bookings: Bookings = loadBookings();
let listener: ((data: Bookings) => void) | null = null;


// Simulates a real-time listener from a database
export function listenToBookings(callback: (data: Bookings) => void): () => void {
  listener = callback;
  // Immediately send the current state loaded from storage
  listener(bookings);

  // Return an "unsubscribe" function
  return () => {
    listener = null;
  };
}

// Simulates saving a document to a database and persists it
export async function saveBooking(dateString: string, slot: string, clientName: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const updatedBookings = { ...bookings };
  if (!updatedBookings[dateString]) {
    updatedBookings[dateString] = {};
  }
  
  updatedBookings[dateString][slot] = { clientName };

  // Update in-memory state and persist to localStorage
  bookings = updatedBookings;
  persistBookings(bookings);

  // Notify the listener of the change
  if (listener) {
    listener({ ...bookings });
  }

  console.log(`Booking saved for ${clientName} on ${dateString} at ${slot}`);
}
