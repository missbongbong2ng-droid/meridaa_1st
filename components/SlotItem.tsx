
import React from 'react';
import { TimeSlot } from '../types';

interface SlotItemProps {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const SlotItem: React.FC<SlotItemProps> = ({ slot, isSelected, onSelect }) => {
  const isAvailable = !slot.isBooked;

  return (
    <button
      onClick={() => isAvailable && onSelect(slot.id)}
      disabled={!isAvailable}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-200 text-left w-full
        ${!isAvailable 
          ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60' 
          : isSelected 
            ? 'bg-blue-50 border-blue-600 shadow-md ring-2 ring-blue-100' 
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isAvailable ? '예약 가능' : '예약 마감'}
        </span>
        <span className="text-sm text-gray-400 font-medium">
          {slot.date}
        </span>
      </div>
      <div className={`text-lg font-bold ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
        {slot.startTime} - {slot.endTime}
      </div>
      
      {isSelected && (
        <div className="absolute top-[-8px] right-[-8px] bg-blue-600 text-white rounded-full p-1 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default SlotItem;
