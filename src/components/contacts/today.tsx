import { connection } from "next/server";
import { CallFocus } from "@/components/contacts/call-focus";
import { Greeting } from "@/components/contacts/greeting";
import { listContacts } from "@/services/contacts";
import { todayInParis } from "@/services/follow-up";

/** « À appeler maintenant », lu à chaque requête : « aujourd'hui » est celui de Paris, au moment de la demande. */
export async function Today() {
  await connection();
  return <CallFocus contacts={await listContacts()} today={todayInParis(new Date())} />;
}

export function TodaySkeleton() {
  return <div aria-busy className="h-56 animate-pulse rounded-xl border border-border bg-muted" />;
}

/** « Bonjour » et la date : rendus à la requête, jamais figés au build. */
export async function TodayGreeting() {
  await connection();
  return <Greeting now={new Date()} />;
}

export function TodayGreetingSkeleton() {
  return (
    <div className="space-y-1">
      <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
      <h1 className="text-4xl font-bold tracking-tight">Bonjour</h1>
    </div>
  );
}
