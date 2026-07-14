// ============================================
// MASTER DATA CONTEXT - Sistem Peminjaman Barang TVRI
// Menyediakan data master (jabatan, divisi, lokasi) secara dinamis dari API
// Menggantikan hard-coded constants agar perubahan oleh admin langsung ter-refleksi
// ============================================

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

  // Fetch semua master data dari API
  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch secara paralel untuk performa lebih baik
      const [jabatanRes, divisiRes, lokasiRes] = await Promise.allSettled([
        api.get('/jabatan/active'),
        api.get('/divisi/active'),
        api.get('/lokasi/active'),
      ]);

      // Jabatan — gunakan data API jika berhasil, fallback ke constants jika gagal
      if (jabatanRes.status === 'fulfilled' && jabatanRes.value.data?.success) {
        const data = jabatanRes.value.data.data;
        // Data dari API berupa array of objects { id, nama, ... } atau array of strings
        const jabatanNames = data.map(item => typeof item === 'string' ? item : item.nama);
        setJabatanList(jabatanNames.length > 0 ? jabatanNames : FALLBACK_JABATAN);
      } else {
        setJabatanList(FALLBACK_JABATAN);
      }

      // Divisi — gunakan data API jika berhasil, fallback ke constants jika gagal
      if (divisiRes.status === 'fulfilled' && divisiRes.value.data?.success) {
        const data = divisiRes.value.data.data;
        const divisiNames = data.map(item => typeof item === 'string' ? item : item.nama);
        setDivisiList(divisiNames.length > 0 ? divisiNames : FALLBACK_DIVISI);
      } else {
        setDivisiList(FALLBACK_DIVISI);
      }

      // Lokasi — gunakan data API jika berhasil
      if (lokasiRes.status === 'fulfilled' && lokasiRes.value.data?.success) {
        const data = lokasiRes.value.data.data;
        setLokasiList(data); // Lokasi bisa berupa array of objects untuk dropdown
      } else {
        setLokasiList([]);
      }
    } catch (error) {
      // Jika error, gunakan fallback dari constants
      setJabatanList(FALLBACK_JABATAN);
      setDivisiList(FALLBACK_DIVISI);
      setLokasiList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data saat pertama kali mount
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // Refresh function — dipanggil setelah admin mengubah master data
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