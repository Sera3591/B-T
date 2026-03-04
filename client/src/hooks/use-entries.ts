import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

export function useEntries() {
  return useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const entriesRef = collection(db, "users", user.uid, "entries");
      const q = query(entriesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const entriesRef = collection(db, "users", user.uid, "entries");
      const docRef = await addDoc(entriesRef, {
        ...data,
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      return { id: docRef.id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({
        title: "Entry saved",
        description: "Your thought has been captured.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}
