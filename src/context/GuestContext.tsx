import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from 'react';
import { Guest, Category, WeddingSettings } from '../types';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDocFromServer,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface GuestContextType {
  guests: Guest[];
  categories: Category[];
  settings: WeddingSettings;
  user: User | null;
  isLoading: boolean;
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt'>) => Promise<void>;
  bulkAddGuests: (guests: Omit<Guest, 'id' | 'createdAt'>[]) => Promise<void>;
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateSettings: (settings: WeddingSettings) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const defaultCategories: string[] = [
  'Family', 'School Friends', 'College Friends', 'Town Friends', 'UAE Friends', 'Work Friends', 'Neighbours', 'Special Guests'
];

const defaultSettings: WeddingSettings = {
  brideName: 'Emma',
  groomName: 'James',
  weddingDate: '2024-09-24',
  venue: 'The Glass House Garden',
  whatsappTemplate: "Hello [Name]! We would love to have you at our wedding on [Date] at [Venue]. Please let us know if you can join us!",
  greetingMessage: "Assalamu alaikum [Name]!",
  invitationTone: "Warm, respectful, and traditional with a touch of elegance.",
  telegramEnabled: false,
};

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<WeddingSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Validate Connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setGuests([]);
        setCategories([]);
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const guestsRef = collection(userRef, 'guests');
    const categoriesRef = collection(userRef, 'categories');
    const settingsRef = doc(userRef, 'settings', 'info');

    // Subscribe to Guests
    const unsubGuests = onSnapshot(guestsRef, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return { 
            id: doc.id, 
            ...d,
            createdAt: d.createdAt?.toMillis?.() || Date.now()
          } as Guest;
        });
        setGuests(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/guests`)
    );

    // Subscribe to Categories
    const unsubCategories = onSnapshot(categoriesRef, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        
        // Only seed if we are sure there is nothing and we haven't seeded yet this session
        // Note: In a real app, you might want to store a 'hasBeenSeeded' flag in the user document
        setCategories(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/categories`)
    );

    // Initial seed if truly empty (one-time check)
    getDocFromServer(settingsRef).then(snap => {
      // This is a simple heuristic: if settings exist but categories are empty, we might want to seed
      // But actually, it's safer to just provide a 'Seed Defaults' action or only do it if the user is truly new.
      // For now, let's keep it simple and just remove the aggressive re-seeding.
    });

    // Subscribe to Settings
    const unsubSettings = onSnapshot(settingsRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...docSnap.data() } as WeddingSettings);
        } else {
          setDoc(settingsRef, { ...defaultSettings, ownerId: user.uid })
            .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/settings/info`));
        }
        setIsLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/settings/info`)
    );

    return () => {
      unsubGuests();
      unsubCategories();
      unsubSettings();
    };
  }, [user]);

  const addGuest = useCallback(async (guestData: Omit<Guest, 'id' | 'createdAt'>) => {
    if (!user) return;
    const path = `users/${user.uid}/guests`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'guests'), {
        ...guestData,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  }, [user]);

  const bulkAddGuests = useCallback(async (guestsData: Omit<Guest, 'id' | 'createdAt'>[]) => {
    if (!user || guestsData.length === 0) return;
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', user.uid);
    const guestsRef = collection(userRef, 'guests');

    guestsData.forEach(data => {
      const newDocRef = doc(guestsRef);
      batch.set(newDocRef, {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
    });

    try {
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/guests (bulk)`);
    }
  }, [user]);

  const updateGuest = useCallback(async (id: string, updates: Partial<Guest>) => {
    if (!user) return;
    const path = `users/${user.uid}/guests/${id}`;
    try {
      await updateDoc(doc(db, path), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  }, [user]);

  const deleteGuest = useCallback(async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/guests/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }, [user]);

  const addCategory = useCallback(async (name: string) => {
    if (!user) return;
    const path = `users/${user.uid}/categories`;
    try {
      await addDoc(collection(db, path), { name, ownerId: user.uid });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  }, [user]);

  const updateCategory = useCallback(async (id: string, nextName: string) => {
    if (!user) return;
    const path = `users/${user.uid}/categories/${id}`;
    const oldCategory = categories.find(c => c.id === id);
    if (!oldCategory) return;
    const oldName = oldCategory.name;

    try {
      const batch = writeBatch(db);
      
      // Update the category document
      batch.update(doc(db, path), { name: nextName });

      // Update all guests that were in this category
      const guestsToUpdate = guests.filter(g => g.category === oldName);
      guestsToUpdate.forEach(guest => {
        const guestRef = doc(db, 'users', user.uid, 'guests', guest.id);
        batch.update(guestRef, { category: nextName });
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  }, [user, categories, guests]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/categories/${id}`;
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;
    const categoryName = categoryToDelete.name;

    try {
      const batch = writeBatch(db);
      
      // Delete the category document
      batch.delete(doc(db, path));

      // Update all guests that were in this category to be "Uncategorized"
      const guestsToUpdate = guests.filter(g => g.category === categoryName);
      guestsToUpdate.forEach(guest => {
        const guestRef = doc(db, 'users', user.uid, 'guests', guest.id);
        batch.update(guestRef, { category: 'Uncategorized' });
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }, [user, categories, guests]);

  const updateSettings = useCallback(async (newSettings: WeddingSettings) => {
    if (!user) return;
    const path = `users/${user.uid}/settings/info`;
    try {
      await setDoc(doc(db, path), { ...newSettings, ownerId: user.uid });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  const login = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if categories are empty for the new user and seed them once
      const categoriesRef = collection(db, 'users', result.user.uid, 'categories');
      const snap = await getDocFromServer(doc(db, 'users', result.user.uid, 'settings', 'info'));
      
      // If user has no settings yet, it's a new user, let's seed categories
      if (!snap.exists()) {
        defaultCategories.forEach(name => {
          addDoc(categoriesRef, { name, ownerId: result.user.uid });
        });
      }
    } catch (error) {
      const authError = error as { code?: string; message?: string };
      console.error("Login Error:", authError.code, authError.message);
      if (authError.code === 'auth/unauthorized-domain') {
        alert("Domain Not Authorized: Please add this domain to your Firebase Console under Authentication > Settings > Authorized Domains.");
      } else if (authError.code === 'auth/popup-blocked') {
        alert("Popup Blocked: Please allow popups for this site to sign in.");
      } else {
        alert("Login failed: " + authError.message);
      }
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(() => ({
    guests,
    categories,
    settings,
    user,
    isLoading,
    addGuest,
    bulkAddGuests,
    updateGuest,
    deleteGuest,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    login,
    logout,
  }), [guests, categories, settings, user, isLoading, addGuest, bulkAddGuests, updateGuest, deleteGuest, addCategory, updateCategory, deleteCategory, updateSettings, login, logout]);

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuests() {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuests must be used within a GuestProvider');
  }
  return context;
}
