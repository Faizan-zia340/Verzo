import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from './AuthContext.js';

const CreditContext = createContext(null);

export function CreditProvider({ children }) {
  const { user } = useAuth();
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

  // Fetch once on mount when signed in, so the navbar pill and dashboard
  // never show a stale balance until the Dashboard page is visited.
  // Clears on logout so the next account never sees the old balance.
  useEffect(() => {
    if (user) fetchCredits();
    else { setCredits(null); setCreditLogs([]); }
  }, [user, fetchCredits]);

  const deductCredit = (amount = 1) => setCredits((prev) => (prev !== null ? prev - amount : prev));

  return <CreditContext.Provider value={{ credits, creditLogs, loading, fetchCredits, deductCredit, setCredits }}>{children}</CreditContext.Provider>;
}

export const useCredits = () => useContext(CreditContext);
