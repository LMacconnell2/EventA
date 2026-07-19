import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";

import { AuthProvider } from "@/auth/AuthProvider";
import { useAuth } from "@/auth/auth-context";
import { router } from "./router";

const queryClient = new QueryClient();

function AppRouter() {
  const auth = useAuth();

  if (auth.isPending) {
    return <div>Loading application...</div>;
  }

  return (
    <RouterProvider
      router={router}
      context={{ auth }}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}