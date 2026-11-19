import { Example } from "@/components/example";
import { getExample } from "@/services/example-service";

export default function ExamplePage() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <Example message={getExample()} />
    </main>
  );
}
