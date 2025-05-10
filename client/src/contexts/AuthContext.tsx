import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (userData: UpdateUserData) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
}

interface UpdateUserData {
  fullName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        // User is not authenticated, that's okay
        console.log("User not authenticated");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Failed to log out",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const newUser = await response.json();
      setUser(newUser);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUser = async (userData: UpdateUserData) => {
    try {
      const response = await apiRequest("PATCH", "/api/auth/me", userData);
      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  // For demonstration purposes, set a sample user if none exists
  useEffect(() => {
    if (!isLoading && !user) {
      // Sample user data for UI demonstration
      setUser({
        id: 1,
        username: "sarah.thompson",
        password: "", // Password should never be exposed to the frontend
        email: "sarah@example.com",
        fullName: "Sarah Thompson",
        role: "director",
        companyId: 1,
        profileImage: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        credits: 72
      });
    }
  }, [isLoading, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
