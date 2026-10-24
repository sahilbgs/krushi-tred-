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

  // Default Admin profile for initial load/offline demo
  const defaultAdmin = {
    uid: "admin_krushi_001",
    email: "admin@krushitrade.com",
    displayName: "મુખ્ય સંચાલક (Main Admin)",
    role: "admin",
    permissions: {
      farmerMaster: true,
      supplierMaster: true,
      seedMaster: true,
      purchaseEntry: true,
      salesBilling: true,
      stockManagement: true,
      payments: true,
      reports: true,
      userManagement: true,
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
      // Default initial login as Main Admin for smooth onboarding
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
      if (email.includes("admin")) {
        setUser({ uid: defaultAdmin.uid, email });
        setUserProfile(defaultAdmin);
        localStorage.setItem('krushi_active_user', JSON.stringify(defaultAdmin));
        return defaultAdmin;
      } else {
        const subUser = {
          uid: "subuser_staff_002",
          email,
          displayName: "રમેશભાઈ પટેલ (સ્ટાફ યુઝર)",
          role: "sub_user",
          permissions: {
            farmerMaster: true,
            supplierMaster: false,
            seedMaster: true,
            purchaseEntry: false,
            salesBilling: true,
            stockManagement: true,
            payments: true,
            reports: false,
            userManagement: false,
            viewRates: false
          }
        };
        setUser({ uid: subUser.uid, email });
        setUserProfile(subUser);
        localStorage.setItem('krushi_active_user', JSON.stringify(subUser));
        return subUser;
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
      const staffUser = {
        uid: "subuser_staff_002",
        email: "staff@krushitrade.com",
        displayName: "રમેશભાઈ (કાઉન્ટર સ્ટાફ)",
        role: "sub_user",
        permissions: {
          farmerMaster: true,
          supplierMaster: false,
          seedMaster: true,
          purchaseEntry: false,
          salesBilling: true,
          stockManagement: true,
          payments: true,
          reports: false,
          userManagement: false,
          viewRates: false
        }
      };
      setUser({ uid: staffUser.uid, email: staffUser.email });
      setUserProfile(staffUser);
      localStorage.setItem('krushi_active_user', JSON.stringify(staffUser));
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
