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
    updateUserProfile: (profile: Partial<UserProfile>) => void;
    addLabReport: (report: LabReport) => void;
    deleteLabReport: (id: string) => void;
    addWorkout: (workout: Workout) => void;
    updateWorkout: (workout: Workout) => void;
    deleteWorkout: (id: string) => void;
    addDietEntry: (diet: Diet) => void;
    updateDietEntry: (diet: Diet) => void;
    deleteDietEntry: (id: string) => void;
    addSleepEntry: (sleep: Sleep) => void;
    updateSleepEntry: (sleep: Sleep) => void;
    deleteSleepEntry: (id: string) => void;
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
            setUser(currentUser);
            if (currentUser) {
                // Initialize user in DB if new
                try {
                    const profile = await initializeUser(currentUser.uid, currentUser.email || '');
                    setUserProfile(profile);
                    setRole(profile.role || 'user');
                    // Store API key locally or in DB? Let's keep local for now for simplicity, or sync to DB profile?
                    // For now, let's look for API key in profile if we decide to store it there.
                } catch (e) {
                    console.error("Error initializing user:", e);
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
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data() as UserProfile;
                setUserProfile(data);
                setRole(data.role || 'user');

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
        if (!user) return;
        await updateDbProfile(user.uid, data);
    };



    // Generic helper for adding/updating/deleting docs in subcollections
    const saveData = async (collectionName: string, data: any) => {
        if (!user) return;
        // Ensure data has an ID (most of our types do, but if new, might need generation.
        // For now, our app generates IDs on creation in the UI/Service before passing here,
        // or we use the Date timestamp as ID in some places.
        // Let's assume data.id exists as per our types.)
        if (!data.id) {
            console.error("Attempted to save data without ID:", data);
            return;
        }
        const ref = doc(db, `users/${user.uid}/${collectionName}`, data.id);
        await setDoc(ref, data);
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
