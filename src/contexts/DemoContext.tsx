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
  addEntity: (entity: Omit<DemoEntity, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => string;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const generateId = (): string => `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const now = (): string => new Date().toISOString();

export function DemoProvider({ children }: { children: ReactNode }): JSX.Element {
  const [assets, setAssets] = useState<DemoAsset[]>(demoAssets);
  const [collections, setCollections] = useState<DemoCollection[]>(demoCollections);
  const [liabilities, setLiabilities] = useState<DemoLiability[]>(demoLiabilities);
  const [entities, setEntities] = useState<DemoEntity[]>(demoEntities);
  const [profile, setProfile] = useState<DemoProfile>(demoProfile);

  const updateProfile = (updates: Partial<DemoProfile>): void => {
    setProfile(prev => ({ ...prev, ...updates, updated_at: now() }));
  };

  const addAsset = (asset: Omit<DemoAsset, 'id' | 'user_id' | 'created_at' | 'updated_at'>): void => {
    const newAsset: DemoAsset = {
      ...asset,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setAssets(prev => [newAsset, ...prev]);
  };

  const updateAsset = (id: string, updates: Partial<DemoAsset>): void => {
    setAssets(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates, updated_at: now() } : a
    ));
  };

  const deleteAsset = (id: string): void => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const addCollection = (collection: Omit<DemoCollection, 'id' | 'user_id' | 'created_at' | 'updated_at'>): void => {
    const newCollection: DemoCollection = {
      ...collection,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setCollections(prev => [newCollection, ...prev]);
  };

  const updateCollection = (id: string, updates: Partial<DemoCollection>): void => {
    setCollections(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updated_at: now() } : c
    ));
  };

  const deleteCollection = (id: string): void => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const addLiability = (liability: Omit<DemoLiability, 'id' | 'user_id' | 'created_at' | 'updated_at'>): void => {
    const newLiability: DemoLiability = {
      ...liability,
      id: generateId(),
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setLiabilities(prev => [newLiability, ...prev]);
  };

  const updateLiability = (id: string, updates: Partial<DemoLiability>): void => {
    setLiabilities(prev => prev.map(l => 
      l.id === id ? { ...l, ...updates, updated_at: now() } : l
    ));
  };

  const deleteLiability = (id: string): void => {
    setLiabilities(prev => prev.filter(l => l.id !== id));
  };

  const addEntity = (entity: Omit<DemoEntity, 'id' | 'user_id' | 'created_at' | 'updated_at'>): string => {
    const newId = generateId();
    const newEntity: DemoEntity = {
      ...entity,
      id: newId,
      user_id: 'demo-user-lucas-soleil',
      created_at: now(),
      updated_at: now(),
    };
    setEntities(prev => [...prev, newEntity]);
    return newId;
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
      addEntity,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextType {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
