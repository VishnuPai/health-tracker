import { getFirestore, doc, setDoc, getDoc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { app } from './firebase';

import type { UserProfile } from '../types';

export const db = getFirestore(app);

export type UserRole = 'user' | 'coach' | 'admin';

// Initialize user in Firestore if not exists
export const initializeUser = async (uid: string, email: string) => {
    console.log(`[DBDebug] Checking user ${uid} in Firestore...`);
    const userRef = doc(db, 'users', uid);
    try {
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.log(`[DBDebug] User ${uid} not found, creating new...`);
            const newUser: UserProfile = {
                uid,
                email,
                role: 'user', // Default role
                // Default empty profile
            };
            await setDoc(userRef, newUser);
            console.log(`[DBDebug] User ${uid} created.`);
            return newUser;
        }
        console.log(`[DBDebug] User ${uid} found.`);
        return userSnap.data() as UserProfile;
    } catch (error) {
        console.error(`[DBDebug] Error in initializeUser for ${uid}:`, error);
        throw error;
    }
};

// Update user profile
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    // Use setDoc with merge: true to handle cases where the doc might not exist yet
    await setDoc(userRef, data, { merge: true });
};

// Fetch all users (Admin/Coach view)
export const getAllUsers = async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};

// AI Usage Tracking
export const getDailyUsage = async (uid: string): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, 'users', uid, 'usage', today);
    const snap = await getDoc(usageRef);

    if (snap.exists()) {
        return snap.data().total || 0;
    }
    return 0;
};

export const checkAndIncrementUsage = async (uid: string, limit: number): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, 'users', uid, 'usage', today);

    try {
        await runTransaction(db, async (transaction) => {
            const usageDoc = await transaction.get(usageRef);
            let currentTotal = 0;

            if (usageDoc.exists()) {
                currentTotal = usageDoc.data().total || 0;
            }



            if (currentTotal >= limit) {
                // Limit reached, throw error to break transaction
                throw new Error("Limit Reached");
            }

            // Increment
            transaction.set(usageRef, {
                total: currentTotal + 1,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        });
        return true;
    } catch (e: any) {
        if (e.message === "Limit Reached") {
            return false;
        }
        console.error("Usage Check Error:", e);
        // Default to allowing if DB fails? Or blocking? Blocking is safer for costs.
        return false;
    }
};
