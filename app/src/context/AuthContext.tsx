import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import type { LoginResponse } from "../types";
import { TOKEN_KEY } from "../api/client";

interface AuthState {
  token: string | null;
  userType: "user" | "authoritative" | null;
  cnic: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (res: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    userType: null,
    cnic: null,
    isLoading: true,
  });

  // Restore token on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userType = (await SecureStore.getItemAsync(
          "sentinel_user_type"
        )) as "user" | "authoritative" | null;
        const cnic = await SecureStore.getItemAsync("sentinel_cnic");

        if (token && userType) {
          setState({ token, userType, cnic, isLoading: false });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const signIn = useCallback(async (res: LoginResponse) => {
    await SecureStore.setItemAsync(TOKEN_KEY, res.access_token);
    await SecureStore.setItemAsync("sentinel_user_type", res.user_type);
    await SecureStore.setItemAsync("sentinel_cnic", res.cnic);
    setState({
      token: res.access_token,
      userType: res.user_type,
      cnic: res.cnic,
      isLoading: false,
    });
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync("sentinel_user_type");
    await SecureStore.deleteItemAsync("sentinel_cnic");
    setState({ token: null, userType: null, cnic: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}