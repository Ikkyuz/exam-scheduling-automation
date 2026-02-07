import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/user';
import { fetchUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface AuthContextType {
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    login: (accessToken: string, refreshToken: string, user: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 90 * 90 * 1000; // 90 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // Set to true initially for auth check
    const navigate = useNavigate();
    const hasVerified = useRef(false); // Track if verification has run

    const logout = useCallback(() => {
        console.log('AuthContext logout: Logging out user (localStorage).');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('lastActivity');
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        console.log('AuthContext logout: Tokens and user state cleared.');
        navigate('/', { replace: true });
    }, [navigate]);

    const login = (newAccessToken: string, newRefreshToken: string, newUser: User) => {
        console.log('AuthContext login: Logging in user:', newUser.username);
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('lastActivity', Date.now().toString());
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        setUser(newUser);
        toast.success(`ยินดีต้อนรับ, ${newUser.firstname || newUser.username}`, { id: 'auth-welcome' });
        console.log('AuthContext login: Tokens and user state updated (localStorage).');
    };

    useEffect(() => {
        if (hasVerified.current) return; // Prevent double execution
        hasVerified.current = true;

        console.log('AuthContext useEffect: Running verifyAuth for session persistence...');
        const verifyAuth = async () => {
            const storedAccessToken = localStorage.getItem('accessToken');
            const storedRefreshToken = localStorage.getItem('refreshToken');
            const lastActivity = localStorage.getItem('lastActivity');

            console.log('AuthContext verifyAuth: Stored tokens (localStorage):', { storedAccessToken: !!storedAccessToken, storedRefreshToken: !!storedRefreshToken });

            if (storedAccessToken && storedRefreshToken) {
                // Check inactivity
                if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT) {
                    console.log('AuthContext verifyAuth: Session expired due to inactivity.');
                    toast.error('หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่', { id: 'session-expired' });
                    logout();
                    setLoading(false);
                    return;
                }

                try {
                    console.log('AuthContext verifyAuth: Attempting to fetch user with session tokens...');
                    const userData = await fetchUser(); // This will trigger api.ts interceptor if token is expired
                    console.log('AuthContext verifyAuth: User fetched successfully (session).', userData);
                    // Update state in case api.ts interceptor refreshed tokens and updated localStorage
                    setAccessToken(localStorage.getItem('accessToken')); 
                    setRefreshToken(localStorage.getItem('refreshToken')); 
                    setUser(userData);
                    localStorage.setItem('lastActivity', Date.now().toString()); // Refresh activity on successful load
                    toast.success(`ยินดีต้อนรับ, ${userData.firstname || userData.username}`, { id: 'auth-welcome' });
                } catch (error) {
                    console.error('AuthContext verifyAuth: Failed to verify user session (localStorage).', error);
                    logout();
                }
            } else {
                console.log('AuthContext verifyAuth: No stored session tokens found. Ensuring logged out state.');
                logout(); // Ensure states are clear
            }
            setLoading(false);
            console.log('AuthContext verifyAuth: Loading set to false.');
        };

        verifyAuth();
    }, [logout]);

    // Inactivity listener
    useEffect(() => {
        if (!user) return;

        const updateActivity = () => {
            localStorage.setItem('lastActivity', Date.now().toString());
        };

        const checkInactivity = setInterval(() => {
            const lastActivity = localStorage.getItem('lastActivity');
            if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT) {
                console.log('User inactive for too long. Logging out...');
                toast.error('หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่', { id: 'inactivity-logout' });
                logout();
            }
        }, 60000); // Check every minute

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, updateActivity));

        return () => {
            clearInterval(checkInactivity);
            events.forEach(event => window.removeEventListener(event, updateActivity));
        };
    }, [user, logout]);
    
    console.log('AuthContext Render: isAuthenticated:', !!accessToken, 'loading:', loading);
    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!accessToken,
            accessToken,
            refreshToken,
            user,
            login,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
