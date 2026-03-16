import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from '@/services/firebase';

type AuthContextValue = {
    user: User | null;
    isAuthLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser);
            setIsAuthLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = useMemo(
        () => ({
            user,
            isAuthLoading,
        }),
        [isAuthLoading, user]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}
