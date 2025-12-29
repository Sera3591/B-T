import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertEntry } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useEntries() {
  return useQuery({
    queryKey: [api.entries.list.path],
    queryFn: async () => {
      const res = await fetch(api.entries.list.path);
      if (!res.ok) throw new Error("Failed to fetch entries");
      return api.entries.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertEntry) => {
      const res = await fetch(api.entries.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create entry");
      }
      return api.entries.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.entries.list.path] });
      toast({
        title: "Entry saved",
        description: "Your thought has been captured.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}
