
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Bookings, ModalType } from './types';
import { TIME_SLOTS } from './constants';
import { listenToBookings, saveBooking } from './services/bookingService';
import { NailPolishIcon, UserIcon, CloseIcon } from './components/Icons';

// --- Helper Functions ---

const getFormattedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// --- Child Components ---

interface HeaderProps {
  selectedDate: Date;
}

const Header: React.FC<HeaderProps> = ({ selectedDate }) => {
  const monthYear = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <header className="p-4 sm:p-6 text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-b-3xl shadow-lg">
      <div className="flex items-center space-x-3">
        <NailPolishIcon className="w-8 h-8 text-pink-200" />
        <div>
          <h1 className="text-2xl font-bold">Horários da Nubia Alves</h1>
          <p className="text-sm text-pink-100">Agende seu horário</p>
        </div>
      </div>
      <h2 className="text-center text-xl font-semibold mt-6 tracking-widest">{monthYear}</h2>
    </header>
  );
};

interface DayCardProps {
  date: Date;
  isSelected: boolean;
  vacancies: number;
  onSelect: (date: Date) => void;
}

const DayCard: React.FC<DayCardProps> = ({ date, isSelected, vacancies, onSelect }) => {
  const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().substring(0, 3);
  const dayOfMonth = date.getDate();

  const getVacancyText = () => {
    if (vacancies === 0) return "Lotado";
    if (vacancies === 1) return "1 Vaga";
    return `${vacancies} Vagas`;
  };

  const baseClasses = "flex flex-col items-center justify-center p-3 w-20 h-28 rounded-xl cursor-pointer transition-all duration-300 transform flex-shrink-0";
  const selectedClasses = "bg-gradient-to-br from-pink-600 to-purple-700 text-white scale-105 shadow-lg";
  const unselectedClasses = "bg-white text-gray-700 hover:bg-pink-100 shadow";
  
  return (
    <div onClick={() => onSelect(date)} className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}>
      <span className={`text-xs font-medium ${isSelected ? 'text-pink-200' : 'text-gray-500'}`}>{dayOfWeek}</span>
      <span className="text-3xl font-bold mt-1">{dayOfMonth}</span>
      <span className={`text-xs font-semibold mt-2 px-2 py-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-pink-100 text-pink-700'}`}>{getVacancyText()}</span>
    </div>
  );
};


interface DateSelectorProps {
  days: Date[];
  selectedDate: Date;
  bookings: Bookings;
  onDateSelect: (date: Date) => void;
}
const DateSelector: React.FC<DateSelectorProps> = ({ days, selectedDate, bookings, onDateSelect }) => {
  return (
    <div className="px-4 py-4">
        <div className="flex space-x-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {days.map(day => {
                const dateString = getFormattedDate(day);
                const bookedSlots = bookings[dateString] ? Object.keys(bookings[dateString]).length : 0;
                const vacancies = TIME_SLOTS.length - bookedSlots;
                return (
                    <DayCard
                        key={day.toISOString()}
                        date={day}
                        isSelected={isSameDay(day, selectedDate)}
                        vacancies={isPast(day) ? 0 : vacancies}
                        onSelect={onDateSelect}
                    />
                );
            })}
        </div>
    </div>
  );
};


interface TimeSlotListProps {
  selectedDate: Date;
  bookings: Bookings;
  onSlotSelect: (slot: string) => void;
}
const TimeSlotList: React.FC<TimeSlotListProps> = ({ selectedDate, bookings, onSlotSelect }) => {
    const isDayInPast = isPast(selectedDate);
    const dailyBookings = bookings[getFormattedDate(selectedDate)] || {};

    return (
        <div className="px-4 mt-2 space-y-3 pb-24">
            <h3 className="text-lg font-semibold text-gray-800">Horários para {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}</h3>
            {TIME_SLOTS.map(slot => {
                const booking = dailyBookings[slot];
                if (isDayInPast) {
                    return (
                        <div key={slot} className="flex items-center justify-between p-4 rounded-lg bg-gray-200 text-gray-500">
                            <span className="font-medium line-through">{slot}</span>
                            <span className="text-sm font-semibold">Indisponível</span>
                        </div>
                    );
                }
                if (booking) {
                    return (
                        <div key={slot} className="flex items-center justify-between p-4 rounded-lg bg-gray-100 text-gray-400">
                            <span className="font-medium">{slot}</span>
                            <div className="flex items-center space-x-2 text-sm">
                                <UserIcon className="w-5 h-5"/>
                                <span className="font-semibold">Agendado: <span className="text-black">{booking.clientName}</span></span>
                            </div>
                        </div>
                    );
                }
                return (
                    <button key={slot} onClick={() => onSlotSelect(slot)} className="w-full flex items-center justify-between p-4 rounded-lg bg-white text-pink-600 shadow hover:shadow-md transition-shadow transform hover:-translate-y-0.5">
                        <span className="text-lg font-bold">{slot}</span>
                        <span className="px-4 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">Disponível</span>
                    </button>
                );
            })}
        </div>
    );
}

interface BookingModalProps {
    date: Date;
    slot: string;
    onClose: () => void;
    onSave: (clientName: string) => Promise<void>;
}
const BookingModal: React.FC<BookingModalProps> = ({ date, slot, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Por favor, insira seu nome.');
            return;
        }
        setError('');
        setIsSaving(true);
        await onSave(name.trim());
        setIsSaving(false);
        onClose();
    };
    
    const formattedDate = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all animate-fade-in-up">
                <h3 className="text-lg font-bold text-gray-800">Confirmar Agendamento</h3>
                <p className="text-gray-600 mt-2">Para <span className="font-semibold text-purple-600">{formattedDate}</span> às <span className="font-semibold text-purple-600">{slot}</span></p>
                <div className="mt-6">
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Seu nome:</label>
                    <input
                        type="text"
                        id="clientName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Maria"
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-wait">
                        {isSaving ? 'Salvando...' : 'Salvar Agendamento'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SummaryModalProps {
    bookings: Bookings;
    onClose: () => void;
}
const SummaryModal: React.FC<SummaryModalProps> = ({ bookings, onClose }) => {
    const futureBookings = useMemo(() => {
        const todayStr = getFormattedDate(new Date());
        return Object.entries(bookings)
            .filter(([dateStr]) => dateStr >= todayStr)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([dateStr, slots]) => {
                const date = new Date(dateStr + 'T00:00:00'); // Ensure correct date parsing
                return {
                    date: date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }),
                    appointments: Object.entries(slots).sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
                };
            })
            .filter(group => group.appointments.length > 0);
    }, [bookings]);

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Resumo de Agendamentos</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {futureBookings.length > 0 ? (
                        futureBookings.map(day => (
                            <div key={day.date}>
                                <h4 className="font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-md inline-block">{day.date}</h4>
                                <ul className="mt-2 ml-2 space-y-1 border-l-2 border-purple-200 pl-4">
                                    {day.appointments.map(([time, booking]) => (
                                        <li key={time} className="text-gray-700">
                                            <span className="font-semibold">{time}:</span> <span className="text-black">{booking.clientName}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center mt-8">Nenhum agendamento futuro.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
  const [bookings, setBookings] = useState<Bookings>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenToBookings((newBookings) => {
      setBookings(newBookings);
    });
    return () => unsubscribe();
  }, []);

  const days = useMemo(() => {
    const dayArray: Date[] = [];
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dayArray.push(date);
    }
    return dayArray;
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleSlotSelect = useCallback((slot: string) => {
    setSelectedSlot(slot);
    setActiveModal('booking');
  }, []);
  
  const handleSaveBooking = useCallback(async (clientName: string) => {
    if (selectedSlot) {
        await saveBooking(getFormattedDate(selectedDate), selectedSlot, clientName);
    }
  }, [selectedDate, selectedSlot]);
  
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedSlot(null);
  }, []);

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-pink-50">
      <Header selectedDate={selectedDate} />
      <main>
        <DateSelector
          days={days}
          selectedDate={selectedDate}
          bookings={bookings}
          onDateSelect={handleDateSelect}
        />
        <TimeSlotList
          selectedDate={selectedDate}
          bookings={bookings}
          onSlotSelect={handleSlotSelect}
        />
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 max-w-xl mx-auto">
          <button onClick={() => setActiveModal('summary')} className="w-full text-center py-3 px-6 text-white font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg hover:opacity-90 transition-opacity">
              Ver Resumo de Agendamentos
          </button>
      </footer>
      
      {activeModal === 'booking' && selectedSlot && (
        <BookingModal 
          date={selectedDate} 
          slot={selectedSlot} 
          onClose={closeModal}
          onSave={handleSaveBooking}
        />
      )}

      {activeModal === 'summary' && (
        <SummaryModal bookings={bookings} onClose={closeModal} />
      )}
    </div>
  );
}
