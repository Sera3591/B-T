import { useState, useEffect } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // 리디렉트 후 결과 처리
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        toast({
          title: "Welcome back",
          description: `Signed in as ${result.user.displayName || result.user.email}`,
        });
      }
    }).catch((error) => {
      console.error("Redirect login error:", error);
    });

    return () => unsubscribe();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut(auth);
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Signed out",
        description: "See you next time.",
      });
    },
  });

  return {
    user,
    loading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
