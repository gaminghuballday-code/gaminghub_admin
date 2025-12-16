import { useState } from 'react';
import type { GenerateLobbyRequest } from '@services/api';
import { useGenerateLobbies } from '@services/api/hooks';

interface FieldError {
  field: string;
  message: string;
}

// Internal form state interface (uses dateType for UI)
interface GenerateLobbyFormData {
  dateType: string;
  timeSlots: string[];
  mode: string;
  subModes: string[];
  region: string;
  price: number;
}

export const useGenerateLobbyLogic = () => {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<string | null>(null);
  
  const generateLobbiesMutation = useGenerateLobbies();

  // Get empty date (no default selection)
  const getEmptyDate = () => {
    return ''; // No default date
  };

  // Check if time has passed for the selected date
  const isTimePassed = (date: string, timeSlot: string): boolean => {
    // If no date selected, return false (allow it, will be validated separately)
    if (!date || date.trim() === '') {
      return false;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Parse the selected date (YYYY-MM-DD format)
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    
    // If date is in the past (before today), time has passed
    if (selectedDate < today) {
      return true;
    }
    
    // If date is in the future, time hasn't passed
    if (selectedDate > today) {
      return false;
    }
    
    // Date is today - check if the specific time has passed
    // Parse time slot (format: "3:00 PM" or "12:00 AM")
    const timeMatch = timeSlot.match(/(\d+):00\s+(AM|PM)/i);
    if (!timeMatch) {
      return false; // Invalid format, allow it (will be validated by backend)
    }
    
    let hour = parseInt(timeMatch[1], 10);
    const period = timeMatch[2].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    // Create datetime for the selected time on today's date
    const selectedDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0);
    
    // Check if time has passed (compare with current time)
    return selectedDateTime < now;
  };

  // Form state (internal - uses dateType)
  const [formData, setFormData] = useState<GenerateLobbyFormData>({
    dateType: getEmptyDate(),
    timeSlots: [],
    mode: 'BR',
    subModes: [],
    region: 'Asia',
    price: 50,
  });

  const closeModal = () => {
    setError(null);
    setFieldErrors({});
    setSuccess(null);
    // Reset form
    setFormData({
      dateType: getEmptyDate(),
      timeSlots: [],
      mode: 'BR',
      subModes: [],
      region: 'Asia',
      price: 50,
    });
  };

  const handleTimeSlotAdd = (timeSlot: string) => {
    const trimmedTimeSlot = timeSlot.trim();
    
    if (!trimmedTimeSlot) {
      return;
    }
    
    // Check if date is selected
    if (!formData.dateType) {
      setError('Please select a date first before adding time slots.');
      setFieldErrors({});
      return;
    }
    
    // Check if time slot already exists
    if (formData.timeSlots.includes(trimmedTimeSlot)) {
      setError('This time slot has already been added.');
      setFieldErrors({});
      return;
    }
    
    // Check if time has passed for the selected date (dynamic check based on selected time)
    if (isTimePassed(formData.dateType, trimmedTimeSlot)) {
      const dateObj = new Date(formData.dateType);
      const isToday = dateObj.toDateString() === new Date().toDateString();
      const dateStr = isToday ? 'today' : `the selected date (${formData.dateType})`;
      setError(`Cannot add ${trimmedTimeSlot} - this time has already passed for ${dateStr}. Please select a future time.`);
      setFieldErrors({});
      return;
    }
    
    // Clear any previous errors
    setError(null);
    setFieldErrors({});
    
    // Add the time slot
    setFormData((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, trimmedTimeSlot],
    }));
  };

  const handleTimeSlotRemove = (timeSlot: string) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((ts) => ts !== timeSlot),
    }));
  };

  const handleSubModeToggle = (subMode: string) => {
    setFormData((prev) => {
      const isSelected = prev.subModes.includes(subMode);
      return {
        ...prev,
        subModes: isSelected
          ? prev.subModes.filter((sm) => sm !== subMode)
          : [...prev.subModes, subMode],
      };
    });
  };

  // Map API field names to form field names
  const mapApiFieldToFormField = (apiField: string): string => {
    // Handle array fields like "timeSlots[0]"
    if (apiField.startsWith('timeSlots[')) {
      const match = apiField.match(/timeSlots\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        return `timeSlots.${index}`;
      }
      return 'timeSlots';
    }
    
    // Map API field names to form field names
    const fieldMap: Record<string, string> = {
      'date': 'dateType',
      'dateType': 'dateType',
      'timeSlots': 'timeSlots',
      'mode': 'mode',
      'subModes': 'subModes',
      'region': 'region',
      'price': 'price',
    };
    
    return fieldMap[apiField] || apiField;
  };
  
  // Parse errors from API response - handle both array format and object format
  const parseApiErrors = (errors: FieldError[] | Record<string, string[]>): Record<string, string[]> => {
    const parsed: Record<string, string[]> = {};
    
    // Handle array format: [{field: "date", message: "..."}, ...]
    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        const field = mapApiFieldToFormField(error.field);
        if (!parsed[field]) {
          parsed[field] = [];
        }
        parsed[field].push(error.message);
      });
    } 
    // Handle object format: {date: ["error1", "error2"], ...}
    else if (typeof errors === 'object') {
      Object.keys(errors).forEach((field) => {
        const mappedField = mapApiFieldToFormField(field);
        if (!parsed[mappedField]) {
          parsed[mappedField] = [];
        }
        if (Array.isArray(errors[field])) {
          parsed[mappedField].push(...errors[field]);
        }
      });
    }
    
    return parsed;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(null);

    // Transform payload: API expects "date" but we use "dateType" internally
    const apiPayload: GenerateLobbyRequest = {
      date: formData.dateType, // Map dateType to date for API
      timeSlots: formData.timeSlots,
      mode: formData.mode,
      subModes: formData.subModes,
      region: formData.region,
      price: formData.price,
    };
    
    generateLobbiesMutation.mutate(apiPayload, {
      onSuccess: (response) => {
        if (response.success) {
          setSuccess(response.message || 'Lobbies generated successfully!');
          setFieldErrors({});
        } else {
          setError(response.message || 'Failed to generate lobbies');
        }
      },
      onError: (err: any) => {
        console.error('Failed to generate lobbies:', err);
        
        // Check if error has errors array (validation errors) - API format: {errors: [{field, message}, ...]}
        if (err?.errors && Array.isArray(err.errors)) {
          const parsedErrors = parseApiErrors(err.errors);
          setFieldErrors(parsedErrors);
          setError(err?.message || 'Validation failed');
        } 
        // Handle errors from response.data.errors array
        else if (err?.response?.data?.errors) {
          if (Array.isArray(err.response.data.errors)) {
            // Array format: [{field: "date", message: "..."}, ...]
            const parsedErrors = parseApiErrors(err.response.data.errors);
            setFieldErrors(parsedErrors);
          } else if (typeof err.response.data.errors === 'object') {
            // Object format: {date: ["error1", "error2"], ...}
            const parsedErrors = parseApiErrors(err.response.data.errors);
            setFieldErrors(parsedErrors);
          }
          setError(err?.response?.data?.message || err?.message || 'Validation failed');
        } 
        // Check if error object itself has errors property (direct from API)
        else if (err?.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
          const parsedErrors = parseApiErrors(err.errors);
          setFieldErrors(parsedErrors);
          setError(err?.message || 'Validation failed');
        }
        else {
          // Generic error
          setError(err?.message || 'Failed to generate lobbies. Please try again.');
          setFieldErrors({});
        }
      },
    });
  };

  // Helper function to get error for a specific field
  const getFieldError = (fieldName: string, index?: number): string[] => {
    const key = index !== undefined ? `${fieldName}.${index}` : fieldName;
    return fieldErrors[key] || [];
  };

  // Handle date change - remove time slots that have passed
  const handleDateChange = (newDate: string) => {
    setError(null);
    setFieldErrors({});
    
    // If date is cleared, clear all time slots
    if (!newDate) {
      setFormData((prev) => ({
        ...prev,
        dateType: newDate,
        timeSlots: [],
      }));
      return;
    }
    
    // Filter out time slots that have passed for the new date
    const validTimeSlots = formData.timeSlots.filter((timeSlot) => {
      return !isTimePassed(newDate, timeSlot);
    });
    
    // If some time slots were removed, show a message
    if (validTimeSlots.length < formData.timeSlots.length) {
      const removedCount = formData.timeSlots.length - validTimeSlots.length;
      setError(`${removedCount} time slot(s) were removed because they have already passed for the selected date.`);
    }
    
    setFormData((prev) => ({
      ...prev,
      dateType: newDate,
      timeSlots: validTimeSlots,
    }));
  };

  return {
    isSubmitting: generateLobbiesMutation.isPending,
    error,
    fieldErrors,
    getFieldError,
    success,
    formData,
    setFormData,
    handleTimeSlotAdd,
    handleTimeSlotRemove,
    handleSubModeToggle,
    handleSubmit,
    closeModal,
    handleDateChange,
    isTimePassed,
  };
};

