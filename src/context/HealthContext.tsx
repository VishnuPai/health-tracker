import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Workout, Diet, Sleep, UserProfile, LabReport } from '../types';
import { auth } from '../services/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { db, initializeUser, updateUserProfile as updateDbProfile } from '../services/db';
import { doc, onSnapshot, collection, setDoc, deleteDoc } from 'firebase/firestore';

interface HealthContextType {
    workouts: Workout[];
    dietEntries: Diet[];
    sleepEntries: Sleep[];
    userProfile: UserProfile | null;
    labReports: LabReport[];
    updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
    addLabReport: (report: LabReport) => Promise<void>;
    deleteLabReport: (id: string) => Promise<void>;
    addWorkout: (workout: Workout) => Promise<void>;
    updateWorkout: (workout: Workout) => Promise<void>;
    deleteWorkout: (id: string) => Promise<void>;
    addDietEntry: (diet: Diet) => Promise<void>;
    updateDietEntry: (diet: Diet) => Promise<void>;
    deleteDietEntry: (id: string) => Promise<void>;
    addSleepEntry: (sleep: Sleep) => Promise<void>;
    updateSleepEntry: (sleep: Sleep) => Promise<void>;
    deleteSleepEntry: (id: string) => Promise<void>;
    clearAllData: () => void; // Deprecated in cloud mode, but kept for interface

    user: User | null;
    loading: boolean;
    role: 'user' | 'coach' | 'admin';
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Auth & User State
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'user' | 'coach' | 'admin'>('user');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Data State
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [dietEntries, setDietEntries] = useState<Diet[]>([]);
    const [sleepEntries, setSleepEntries] = useState<Sleep[]>([]);
    const [labReports, setLabReports] = useState<LabReport[]>([]);


    // 1. Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("[AuthDebug] Auth State Changed:", currentUser ? `Logged in as ${currentUser.uid}` : "Logged out");
            setUser(currentUser);
            if (currentUser) {
                // Initialize user in DB if new
                try {
                    console.log("[AuthDebug] Initializing user profile in DB...");
                    const profile = await initializeUser(currentUser.uid, currentUser.email || '');
                    console.log("[AuthDebug] Profile Loaded:", profile);
                    setUserProfile(profile);
                    setRole(profile.role || 'user');
                } catch (e) {
                    console.error("[AuthDebug] Error initializing user:", e);
                    // Critical: If DB fails, we still have a user, but no profile.
                }
            } else {
                setRole('user');
                setUserProfile(null);
                setWorkouts([]);
                setDietEntries([]);
                setSleepEntries([]);
                setLabReports([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Data Listeners (Real-time Sync)
    useEffect(() => {
        if (!user) return;

        // Listen to User Profile changes (e.g. Role updates)
        // Listen to User Profile changes (e.g. Role updates)
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data() as UserProfile;
                // Ensure UID is present (backfill from auth if missing in doc)
                const fullProfile = { ...data, uid: data.uid || user.uid };
                setUserProfile(fullProfile);
                setRole(fullProfile.role || 'user');
                console.log("[AuthDebug] Profile updated from snapshot:", fullProfile);
            }
        });

        // Listen to Sub-collections (logs, diet, workouts etc.)
        // Ideally we structure this as cleaner collections: `users/{uid}/workouts`.

        const qWorkouts = collection(db, `users/${user.uid}/workouts`);
        const unsubWorkouts = onSnapshot(qWorkouts, (snapshot) => {
            setWorkouts(snapshot.docs.map(d => d.data() as Workout));
        });

        const qDiet = collection(db, `users/${user.uid}/diet`);
        const unsubDiet = onSnapshot(qDiet, (snapshot) => {
            setDietEntries(snapshot.docs.map(d => d.data() as Diet));
        });

        const qSleep = collection(db, `users/${user.uid}/sleep`);
        const unsubSleep = onSnapshot(qSleep, (snapshot) => {
            setSleepEntries(snapshot.docs.map(d => d.data() as Sleep));
        });

        const qLabs = collection(db, `users/${user.uid}/labs`);
        const unsubLabs = onSnapshot(qLabs, (snapshot) => {
            setLabReports(snapshot.docs.map(d => d.data() as LabReport));
        });

        return () => {
            unsubProfile();
            unsubWorkouts();
            unsubDiet();
            unsubSleep();
            unsubLabs();
        };
    }, [user]);


    // Action Handlers - writing to Firestore
    const updateUserProfileHandler = async (data: Partial<UserProfile>) => {
        if (!user) {
            console.error("[AuthDebug] Cannot update profile: No user logged in.");
            throw new Error("No user logged in. Please refresh and try again.");
        }
        console.log("[AuthDebug] Updating profile for:", user.uid, data);
        try {
            await updateDbProfile(user.uid, data);
            // Manually update local state to reflect change immediately (optimistic UI)
            setUserProfile(prev => prev ? { ...prev, ...data } : null);
            console.log("[AuthDebug] Profile updated successfully.");
        } catch (error) {
            console.error("[AuthDebug] Error updating profile:", error);
            throw error;
        }
    };



    // Generic helper for adding/updating/deleting docs in subcollections
    const saveData = async (collectionName: string, data: any) => {
        if (!user) {
            console.error(`[DBDebug] Cannot save to ${collectionName}: No user logged in.`);
            throw new Error(`Cannot save to ${collectionName}: No user logged in.`);
        }
        if (!data.id) {
            console.error(`[DBDebug] Attempted to save to ${collectionName} without ID:`, data);
            return;
        }
        console.log(`[DBDebug] Saving to ${collectionName}:`, data);
        try {
            // Firestore does not like 'undefined' values.
            // We strip them out by JSON-cycling.
            const cleanData = JSON.parse(JSON.stringify(data));
            const ref = doc(db, `users/${user.uid}/${collectionName}`, data.id);
            await setDoc(ref, cleanData);
            console.log(`[DBDebug] Saved to ${collectionName} successfully.`);
        } catch (e) {
            console.error(`[DBDebug] Error saving to ${collectionName}:`, e);
            throw e;
        }
    };

    const deleteData = async (collectionName: string, id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, id));
    };

    const value = {
        workouts,
        dietEntries,
        sleepEntries,
        userProfile,
        labReports,
        updateUserProfile: updateUserProfileHandler,
        addLabReport: (r: LabReport) => saveData('labs', r),
        deleteLabReport: (id: string) => deleteData('labs', id),
        addWorkout: (w: Workout) => saveData('workouts', w),
        updateWorkout: (w: Workout) => saveData('workouts', w),
        deleteWorkout: (id: string) => deleteData('workouts', id),
        addDietEntry: (d: Diet) => saveData('diet', d),
        updateDietEntry: (d: Diet) => saveData('diet', d),
        deleteDietEntry: (id: string) => deleteData('diet', id),
        addSleepEntry: (s: Sleep) => saveData('sleep', s),
        updateSleepEntry: (s: Sleep) => saveData('sleep', s),
        deleteSleepEntry: (id: string) => deleteData('sleep', id),
        clearAllData: () => { }, // No-op in cloud
        user,
        loading,
        role
    };

    return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
};

export const useHealth = () => {
    const context = useContext(HealthContext);
    if (context === undefined) {
        throw new Error('useHealth must be used within a HealthProvider');
    }
    return context;
};
