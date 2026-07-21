

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { JABATAN as FALLBACK_JABATAN, DIVISI as FALLBACK_DIVISI } from '../utils/constants';

const MasterDataContext = createContext(null);

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within MasterDataProvider');
  }
  return context;
};

export const MasterDataProvider = ({ children }) => {
  const [jabatanList, setJabatanList] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [lokasiList, setLokasiList] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);

      
      const [jabatanRes, divisiRes, lokasiRes] = await Promise.allSettled([
        api.get('/jabatan/active'),
        api.get('/divisi/active'),
        api.get('/lokasi/active'),
      ]);

      
      if (jabatanRes.status === 'fulfilled' && jabatanRes.value.data?.success) {
        const data = jabatanRes.value.data.data;
        
        const jabatanNames = data.map(item => typeof item === 'string' ? item : item.nama);
        setJabatanList(jabatanNames.length > 0 ? jabatanNames : FALLBACK_JABATAN);
      } else {
        setJabatanList(FALLBACK_JABATAN);
      }

      
      if (divisiRes.status === 'fulfilled' && divisiRes.value.data?.success) {
        const data = divisiRes.value.data.data;
        const divisiNames = data.map(item => typeof item === 'string' ? item : item.nama);
        setDivisiList(divisiNames.length > 0 ? divisiNames : FALLBACK_DIVISI);
      } else {
        setDivisiList(FALLBACK_DIVISI);
      }

      
      if (lokasiRes.status === 'fulfilled' && lokasiRes.value.data?.success) {
        const data = lokasiRes.value.data.data;
        setLokasiList(data); 
      } else {
        setLokasiList([]);
      }
    } catch (error) {
      
      setJabatanList(FALLBACK_JABATAN);
      setDivisiList(FALLBACK_DIVISI);
      setLokasiList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  
  const refreshMasterData = useCallback(async () => {
    await fetchMasterData();
  }, [fetchMasterData]);

  const value = {
    jabatanList,
    divisiList,
    lokasiList,
    loading,
    refreshMasterData,
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
};

export default MasterDataContext;