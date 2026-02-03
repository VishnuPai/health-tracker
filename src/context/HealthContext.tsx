import React, { createContext, useContext, type ReactNode } from 'react';
import type { Workout, Diet, Sleep, UserProfile, LabReport } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface HealthContextType {
    workouts: Workout[];
    dietEntries: Diet[];
    sleepEntries: Sleep[];
    userProfile: UserProfile | null;
    labReports: LabReport[];
    updateUserProfile: (profile: UserProfile) => void;
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
    clearAllData: () => void;
    apiKey: string;
    updateApiKey: (key: string) => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [workouts, setWorkouts] = useLocalStorage<Workout[]>('ht_workouts', []);
    const [dietEntries, setDietEntries] = useLocalStorage<Diet[]>('ht_diet', []);
    const [sleepEntries, setSleepEntries] = useLocalStorage<Sleep[]>('ht_sleep', []);
    const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('ht_profile', null);
    const [labReports, setLabReports] = useLocalStorage<LabReport[]>('ht_labs', []);
    const [apiKey, setApiKey] = useLocalStorage<string>('ht_api_key', '');

    const updateUserProfile = (profile: UserProfile) => {
        setUserProfile(profile);
    };

    const addLabReport = (report: LabReport) => {
        setLabReports((prev) => [...prev, report]);
    };

    const deleteLabReport = (id: string) => {
        setLabReports((prev) => prev.filter((r) => r.id !== id));
    };

    const addWorkout = (workout: Workout) => {
        setWorkouts((prev) => [...prev, workout]);
    };

    const updateWorkout = (updatedWorkout: Workout) => {
        setWorkouts((prev) => prev.map((w) => (w.id === updatedWorkout.id ? updatedWorkout : w)));
    };

    const deleteWorkout = (id: string) => {
        setWorkouts((prev) => prev.filter((w) => w.id !== id));
    };

    const addDietEntry = (diet: Diet) => {
        setDietEntries((prev) => [...prev, diet]);
    };

    const updateDietEntry = (updatedDiet: Diet) => {
        setDietEntries((prev) => prev.map((d) => (d.id === updatedDiet.id ? updatedDiet : d)));
    };

    const deleteDietEntry = (id: string) => {
        setDietEntries((prev) => prev.filter((d) => d.id !== id));
    };

    const addSleepEntry = (sleep: Sleep) => {
        setSleepEntries((prev) => [...prev, sleep]);
    };

    const updateSleepEntry = (updatedSleep: Sleep) => {
        setSleepEntries((prev) => prev.map((s) => (s.id === updatedSleep.id ? updatedSleep : s)));
    };

    const deleteSleepEntry = (id: string) => {
        setSleepEntries((prev) => prev.filter((s) => s.id !== id));
    };

    const clearAllData = () => {
        setWorkouts([]);
        setDietEntries([]);
        setSleepEntries([]);
        setLabReports([]);
    };

    const updateApiKey = (key: string) => {
        setApiKey(key);
    };

    const value = {
        workouts,
        dietEntries,
        sleepEntries,
        userProfile,
        labReports,
        updateUserProfile,
        addLabReport,
        deleteLabReport,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        addDietEntry,
        updateDietEntry,
        deleteDietEntry,
        addSleepEntry,
        updateSleepEntry,
        deleteSleepEntry,
        clearAllData,
        apiKey,
        updateApiKey
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
