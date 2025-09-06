import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User } from "@pkg/types";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me"),
    retry: false,
  });

  return { user, isLoading };
}
