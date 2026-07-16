import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getMe, loginUser, registerUser, logoutUser, googleLogin, type UserProfile } from "./api";

interface MfaPending {
  userId: string;
  message: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mfaPending: MfaPending | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<UserProfile | MfaPending>;
  signup: (
    name: string,
    email: string,
    password: string,
    captchaAnswer: string,
    captchaToken: string,
  ) => Promise<UserProfile>;
  googleSignIn: (credential: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  clearMfaPending: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState<MfaPending | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<UserProfile | MfaPending> => {
      const res = await loginUser(email, password);
      // MFA pending — don't set user yet
      if (res.mfaPending && res.userId) {
        const pending = { userId: res.userId, message: res.message ?? "Enter your authenticator code." };
        setMfaPending(pending);
        return pending;
      }
      if (res.user) {
        setUser(res.user);
        return res.user;
      }
      throw new Error("Unexpected login response");
    },
    [],
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      captchaAnswer: string,
      captchaToken: string,
    ): Promise<UserProfile> => {
      const res = await registerUser(name, email, password, captchaAnswer, captchaToken);
      if (res.user) {
        setUser(res.user);
        return res.user;
      }
      throw new Error("Unexpected register response");
    },
    [],
  );

  const googleSignIn = useCallback(async (credential: string): Promise<UserProfile> => {
    const res = await googleLogin(credential);
    if (res.user) {
      setUser(res.user);
      return res.user;
    }
    throw new Error("Unexpected Google login response");
  }, []);

  const logout = useCallback(async () => {
    await logoutUser().catch(() => {});
    setUser(null);
    setMfaPending(null);
  }, []);

  const clearMfaPending = useCallback(() => setMfaPending(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        mfaPending,
        login,
        signup,
        googleSignIn,
        logout,
        refreshUser,
        setUser,
        clearMfaPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
