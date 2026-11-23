import { describe, expect, it } from "vitest";
import { addContact, getContact, setStage, setFollowUp } from "@/services/contacts";
import { todayInParis } from "@/services/follow-up";
import { getWeekSummary } from "@/services/week";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

async function newContact(name: string) {
  const r = await addContact({ name });
  if (!r.ok) throw new Error("création impossible");
  return r.contact;
}

describe("Ta semaine : service + données (lot 10)", () => {
  it("un appel est daté ; la date reste tant qu'il est appelé et s'efface s'il repasse « À appeler »", async () => {
    const c = await newContact("Claire Martin");
    expect((await getContact(c.id))!.calledAt).toBeNull();

    const before = Date.now();
    await setStage(c.id, "appeleEnAttente");
    const calledAt = (await getContact(c.id))!.calledAt!;
    expect(Date.parse(calledAt)).toBeGreaterThanOrEqual(before - 1);

    await setStage(c.id, "accepte");
    expect((await getContact(c.id))!.calledAt).toBe(calledAt);

    await setStage(c.id, "aAppeler");
    expect((await getContact(c.id))!.calledAt).toBeNull();
  });

  it("les chiffres changent après chaque changement de suivi", async () => {
    const a = await newContact("Hugo Petit");
    const b = await newContact("Léa Roux");
    const start = await getWeekSummary(new Date());

    await setStage(a.id, "accepte");
    await setStage(b.id, "refuse");
    await setFollowUp(a.id, todayInParis(new Date()));
    const after = await getWeekSummary(new Date());
    expect(after.callsThisWeek).toBe(start.callsThisWeek + 2);
    expect(after.acceptanceRate).not.toBeNull();

    const c = await newContact("Inès Blanc");
    await setFollowUp(c.id, todayInParis(new Date()));
    expect((await getWeekSummary(new Date())).upcoming.map((x) => x.id)).toContain(c.id);

    await setStage(a.id, "aAppeler");
    expect((await getWeekSummary(new Date())).callsThisWeek).toBe(after.callsThisWeek - 1);
  });
});
