import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { app } from './firebase';

import type { UserProfile } from '../types';

export const db = getFirestore(app);

export type UserRole = 'user' | 'coach' | 'admin';

// Initialize user in Firestore if not exists
export const initializeUser = async (uid: string, email: string) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newUser: UserProfile = {
            uid,
            email,
            role: 'user', // Default role
            // Default empty profile
        };
        await setDoc(userRef, newUser);
        return newUser;
    }
    return userSnap.data() as UserProfile;
};

// Update user profile
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};

// Fetch all users (Admin/Coach view)
export const getAllUsers = async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};
