import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api.js';

const CreditContext = createContext(null);

export function CreditProvider({ children }) {
  const [credits, setCredits] = useState(null);
  const [creditLogs, setCreditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/credits');
      setCredits(data.credits ?? null);
      setCreditLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (_) {
      setCreditLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deductCredit = (amount = 1) => setCredits((prev) => (prev !== null ? prev - amount : prev));

  return <CreditContext.Provider value={{ credits, creditLogs, loading, fetchCredits, deductCredit, setCredits }}>{children}</CreditContext.Provider>;
}

export const useCredits = () => useContext(CreditContext);
