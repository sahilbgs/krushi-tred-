import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default Admin profile: Ravi Chaudhary (Main Admin)
  const defaultAdmin = {
    uid: "admin_ravi_001",
    email: "ravi@nandiniseeds.com",
    displayName: "Ravi Chaudhary (મુખ્ય સંચાલક)",
    role: "admin",
    company: "SHREE NANDINI SEEDS",
    permissions: {
      farmerMaster: true,
      supplierMaster: true,
      partyMaster: true,
      seedMaster: true,
      purchaseEntry: true,
      salesBilling: true,
      stockManagement: true,
      payments: true,
      khataBook: true,
      rojmel: true,
      reports: true,
      userManagement: true,
      viewRates: true
    }
  };

  // Sub User profile: Bhargav Chaudhary (Sub User)
  const defaultSubUser = {
    uid: "subuser_bhargav_002",
    email: "bhargav@nandiniseeds.com",
    displayName: "Bhargav Chaudhary (સબ યુઝર)",
    role: "sub_user",
    company: "SHREE NANDINI SEEDS",
    permissions: {
      farmerMaster: true,
      supplierMaster: true,
      partyMaster: true,
      seedMaster: true,
      purchaseEntry: true,
      salesBilling: true,
      stockManagement: true,
      payments: true,
      khataBook: true,
      rojmel: true,
      reports: false,
      userManagement: false, // Main Admin દ્વારા સંચાલિત, ડિફૉલ્ટ બંધ
      viewRates: true
    }
  };

  useEffect(() => {
    // Check local storage for active session first
    const savedUser = localStorage.getItem('krushi_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser({ uid: parsed.uid, email: parsed.email });
        setUserProfile(parsed);
      } catch (e) {
        console.error("Local user parse error", e);
      }
    } else {
      // Default initial login as Ravi Chaudhary (Main Admin)
      setUser({ uid: defaultAdmin.uid, email: defaultAdmin.email });
      setUserProfile(defaultAdmin);
      localStorage.setItem('krushi_active_user', JSON.stringify(defaultAdmin));
    }

    // If Firebase is configured with real project credentials, listen to Auth
    if (isFirebaseConfigured()) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUserProfile({ uid: currentUser.uid, ...data });
              localStorage.setItem('krushi_active_user', JSON.stringify({ uid: currentUser.uid, ...data }));
            }
          } catch (err) {
            console.warn("Could not fetch remote profile, using existing session:", err);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // Standard Login
  const login = async (email, password) => {
    if (isFirebaseConfigured()) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", res.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profile = { uid: res.user.uid, ...data };
        setUser(res.user);
        setUserProfile(profile);
        localStorage.setItem('krushi_active_user', JSON.stringify(profile));
        return profile;
      }
    } else {
      // Offline/Local validation
      if (email.toLowerCase().includes("ravi") || email.toLowerCase().includes("admin")) {
        setUser({ uid: defaultAdmin.uid, email });
        setUserProfile(defaultAdmin);
        localStorage.setItem('krushi_active_user', JSON.stringify(defaultAdmin));
        return defaultAdmin;
      } else {
        setUser({ uid: defaultSubUser.uid, email });
        setUserProfile(defaultSubUser);
        localStorage.setItem('krushi_active_user', JSON.stringify(defaultSubUser));
        return defaultSubUser;
      }
    }
  };

  // Switch Role / Quick Demo Login
  const loginAsDemo = (roleType) => {
    if (roleType === 'admin') {
      setUser({ uid: defaultAdmin.uid, email: defaultAdmin.email });
      setUserProfile(defaultAdmin);
      localStorage.setItem('krushi_active_user', JSON.stringify(defaultAdmin));
    } else {
      setUser({ uid: defaultSubUser.uid, email: defaultSubUser.email });
      setUserProfile(defaultSubUser);
      localStorage.setItem('krushi_active_user', JSON.stringify(defaultSubUser));
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured()) {
      try { await signOut(auth); } catch (e) {}
    }
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('krushi_active_user');
  };

  const hasPermission = (permissionKey) => {
    if (!userProfile) return false;
    if (userProfile.role === 'admin' || userProfile.role === 'main_admin') return true;
    return !!userProfile.permissions?.[permissionKey];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      login, 
      loginAsDemo, 
      logout, 
      hasPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
