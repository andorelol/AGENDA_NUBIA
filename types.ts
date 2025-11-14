
export interface Booking {
  clientName: string;
}

export interface Bookings {
  [date: string]: {
    [time: string]: Booking;
  };
}

export type ModalType = 'booking' | 'summary' | null;
