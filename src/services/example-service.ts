import { readExample } from "@/data/example-repository";

export function getExample(): string {
  return readExample();
}
