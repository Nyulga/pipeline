import type { Metadata } from "next";
import { Simulation } from "./simulation";

export const metadata: Metadata = {
  title: "Simulation · Pipeline",
};

export default function SimulationPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <Simulation />
    </main>
  );
}
