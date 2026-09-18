import type { Metadata } from "next";
import BrainDump from "@/components/BrainDump";

export const metadata: Metadata = {
  title: "DropList — cut my list",
  description:
    "Paste your brain dump, get a ruthless DROP / DELAY / DELEGATE verdict on every line.",
};

export default function AppPage() {
  return (
    <main>
      <BrainDump />
    </main>
  );
}
