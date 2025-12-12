import { createContext, useContext, useState, ReactNode } from 'react';
import { Asset } from '@/hooks/useAssets';
import { Collection } from '@/hooks/useCollections';
import { Liability } from '@/hooks/useLiabilities';
import { demoAssets, demoCollections, demoLiabilities, demoNetWorthHistory } from '@/data/demoData';

interface DemoContextType {
  assets: Asset[];
  collections: Collection[];
  liabilities: Liability[];
  netWorthHistory: typeof demoNetWorthHistory;
  addAsset: (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addCollection: (collection: Omit<Collection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addLiability: (liability: Omit<Liability, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateLiability: (id: string, updates: Partial<Liability>) => void;
  deleteLiability: (id: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>(demoAssets);
  const [collections, setCollections] = useState<Collection[]>(demoCollections);
  const [liabilities, setLiabilities] = useState<Liability[]>(demoLiabilities);

  const generateId = () => `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = () => new Date().toISOString();

  const addAsset = (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newAsset: Asset = {
      ...asset,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setAssets(prev => [newAsset, ...prev]);
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates, updated_at: now() } : a
    ));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const addCollection = (collection: Omit<Collection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newCollection: Collection = {
      ...collection,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setCollections(prev => [newCollection, ...prev]);
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updated_at: now() } : c
    ));
  };

  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const addLiability = (liability: Omit<Liability, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newLiability: Liability = {
      ...liability,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setLiabilities(prev => [newLiability, ...prev]);
  };

  const updateLiability = (id: string, updates: Partial<Liability>) => {
    setLiabilities(prev => prev.map(l => 
      l.id === id ? { ...l, ...updates, updated_at: now() } : l
    ));
  };

  const deleteLiability = (id: string) => {
    setLiabilities(prev => prev.filter(l => l.id !== id));
  };

  return (
    <DemoContext.Provider value={{
      assets,
      collections,
      liabilities,
      netWorthHistory: demoNetWorthHistory,
      addAsset,
      updateAsset,
      deleteAsset,
      addCollection,
      updateCollection,
      deleteCollection,
      addLiability,
      updateLiability,
      deleteLiability,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
