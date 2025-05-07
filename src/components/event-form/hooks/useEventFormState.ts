
import { useState } from 'react';

export const useEventFormState = () => {
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedAmenity, setSelectedAmenity] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [startAmPm, setStartAmPm] = useState('AM');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [endAmPm, setEndAmPm] = useState('AM');
  const [eventDate, setEventDate] = useState<Date>();
  const [notes, setNotes] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [selectedRecurringPattern, setSelectedRecurringPattern] = useState<string>('');
  const [customPatternDescription, setCustomPatternDescription] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');

  return {
    isRecurring,
    setIsRecurring,
    selectedRegion,
    setSelectedRegion,
    selectedBuilding,
    setSelectedBuilding,
    selectedAmenity,
    setSelectedAmenity,
    selectedEventType,
    setSelectedEventType,
    eventTitle,
    setEventTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    startHour,
    setStartHour,
    startMinute,
    setStartMinute,
    startAmPm,
    setStartAmPm,
    endHour,
    setEndHour,
    endMinute,
    setEndMinute,
    endAmPm,
    setEndAmPm,
    eventDate,
    setEventDate,
    notes,
    setNotes,
    cost,
    setCost,
    contactPhone,
    setContactPhone,
    contactEmail,
    setContactEmail,
    attachment,
    setAttachment,
    selectedRecurringPattern,
    setSelectedRecurringPattern,
    customPatternDescription,
    setCustomPatternDescription,
    selectedDay,
    setSelectedDay
  };
};
