
import type { Bookings } from '../types';

// Initial mock data
const initialBookings: Bookings = {
  [getFormattedDate(new Date(Date.now() + 86400000 * 2))]: { // 2 days from now
    "10:30": { clientName: "Ana" },
    "17:00": { clientName: "Carla" },
  },
  [getFormattedDate(new Date(Date.now() + 86400000 * 5))]: { // 5 days from now
    "09:00": { clientName: "Sofia" },
  }
};

let bookings: Bookings = initialBookings;
let listener: ((data: Bookings) => void) | null = null;

function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}


// Simulates a real-time listener from a database (e.g., Firebase's onSnapshot)
export function listenToBookings(callback: (data: Bookings) => void): () => void {
  listener = callback;
  // Immediately send the current state
  listener(bookings);

  // Return an "unsubscribe" function
  return () => {
    listener = null;
  };
}

// Simulates saving a document to a database
export async function saveBooking(dateString: string, slot: string, clientName: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!bookings[dateString]) {
    bookings[dateString] = {};
  }
  
  bookings[dateString][slot] = { clientName };

  // Notify the listener of the change
  if (listener) {
    listener({ ...bookings });
  }

  console.log(`Booking saved for ${clientName} on ${dateString} at ${slot}`);
}
