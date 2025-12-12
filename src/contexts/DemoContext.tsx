import { createContext, useContext, useState, ReactNode } from 'react';
import { demoAssets, demoCollections, demoLiabilities, demoNetWorthHistory, demoEntities, demoProfile, DemoEntity, DemoProfile, DemoAsset, DemoLiability, DemoCollection } from '@/data/demoData';

interface DemoContextType {
  assets: DemoAsset[];
  collections: DemoCollection[];
  liabilities: DemoLiability[];
  entities: DemoEntity[];
  profile: DemoProfile;
  netWorthHistory: typeof demoNetWorthHistory;
  updateProfile: (updates: Partial<DemoProfile>) => void;
  addAsset: (asset: Omit<DemoAsset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateAsset: (id: string, updates: Partial<DemoAsset>) => void;
  deleteAsset: (id: string) => void;
  addCollection: (collection: Omit<DemoCollection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateCollection: (id: string, updates: Partial<DemoCollection>) => void;
  deleteCollection: (id: string) => void;
  addLiability: (liability: Omit<DemoLiability, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateLiability: (id: string, updates: Partial<DemoLiability>) => void;
  deleteLiability: (id: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<DemoAsset[]>(demoAssets);
  const [collections, setCollections] = useState<DemoCollection[]>(demoCollections);
  const [liabilities, setLiabilities] = useState<DemoLiability[]>(demoLiabilities);
  const [entities] = useState<DemoEntity[]>(demoEntities);
  const [profile, setProfile] = useState<DemoProfile>(demoProfile);

  const updateProfile = (updates: Partial<DemoProfile>) => {
    setProfile(prev => ({ ...prev, ...updates, updated_at: new Date().toISOString() }));
  };

  const generateId = () => `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = () => new Date().toISOString();

  const addAsset = (asset: Omit<DemoAsset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newAsset: DemoAsset = {
      ...asset,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setAssets(prev => [newAsset, ...prev]);
  };

  const updateAsset = (id: string, updates: Partial<DemoAsset>) => {
    setAssets(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates, updated_at: now() } : a
    ));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const addCollection = (collection: Omit<DemoCollection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newCollection: DemoCollection = {
      ...collection,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setCollections(prev => [newCollection, ...prev]);
  };

  const updateCollection = (id: string, updates: Partial<DemoCollection>) => {
    setCollections(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updated_at: now() } : c
    ));
  };

  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const addLiability = (liability: Omit<DemoLiability, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newLiability: DemoLiability = {
      ...liability,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setLiabilities(prev => [newLiability, ...prev]);
  };

  const updateLiability = (id: string, updates: Partial<DemoLiability>) => {
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
      entities,
      profile,
      netWorthHistory: demoNetWorthHistory,
      updateProfile,
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
