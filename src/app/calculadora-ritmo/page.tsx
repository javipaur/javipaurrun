import type { Metadata } from "next";
import PaceCalculator from "./PaceCalculator";

export const metadata: Metadata = {
  title: "Calculadora de ritmo - JavipaurRun",
  description:
    "Calcula tu ritmo por km, velocidad media y predice tiempos para distintas distancias. Ideal para runners y corredores populares.",
};

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calculadora de ritmo</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          Calcula ritmo/km, velocidad y tiempos estimados para tus carreras
        </p>
      </div>
      <PaceCalculator />
    </div>
  );
}
