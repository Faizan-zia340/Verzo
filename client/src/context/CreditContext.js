import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api.js';

const CreditContext = createContext(null);

export function CreditProvider({ children }) {
  const [credits, setCredits] = useState(null);
  const [creditLogs, setCreditLogs] = useState([]);

  const fetchCredits = useCallback(async () => {
    try {
      const { data } = await api.get('/credits');
      setCredits(data.credits);
      setCreditLogs(data.logs);
    } catch (_) {}
  }, []);

  const deductCredit = (amount = 1) => setCredits((prev) => (prev !== null ? prev - amount : prev));

  return <CreditContext.Provider value={{ credits, creditLogs, fetchCredits, deductCredit, setCredits }}>{children}</CreditContext.Provider>;
}

export const useCredits = () => useContext(CreditContext);
