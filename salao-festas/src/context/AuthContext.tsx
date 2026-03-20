import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  signup: (
    email: string,
    senha: string,
    nome: string,
    telefone: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function buscarAdmin(usuarioId?: string) {
    if (!usuarioId) {
      setIsAdmin(false);
      return;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("is_admin")
      .eq("id", usuarioId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar admin:", error);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(data?.is_admin === true);
  }

  useEffect(() => {
    let mounted = true;

    async function carregarSessaoInicial() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Erro ao buscar sessão:", error);
          setUser(null);
          setIsAdmin(false);
          return;
        }

        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Erro inesperado ao carregar sessão:", error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    carregarSessaoInicial();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    buscarAdmin(user?.id ?? undefined);
  }, [user]);

  async function login(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }

  async function signup(
    email: string,
    senha: string,
    nome: string,
    telefone: string
  ) {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          full_name: nome,
          name: nome,
          phone: telefone,
        },
      },
    });

    if (error) {
      console.error("Erro no cadastro:", error);
      throw error;
    }
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Erro no login com Google:", error);
      throw error;
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro no signOut:", error);
      throw error;
    }

    setUser(null);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        login,
        signup,
        loginWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  }

  return context;
}