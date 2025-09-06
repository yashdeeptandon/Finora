import { UiReady } from "@pkg/ui";
import type { AppBrand } from "@pkg/types";

export default function Home() {
  const brand: AppBrand = "Finora";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">{brand} 💰</h1>
      <p className="mt-3 text-gray-600">
        UI: {String(UiReady)}
      </p>
    </main>
  );
}
