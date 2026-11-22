import { describe, expect, it } from "vitest";
import { callQueue, nextDay } from "@/services/call-queue";
import { addContact, listContacts, setFollowUp } from "@/services/contacts";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

describe("« Plus tard » sur une vraie base (lot 7)", () => {
  it("la relance au lendemain sort le contact de la file du jour ; il y revient le lendemain", async () => {
    const r = await addContact({ name: "Plus tard réel" });
    if (!r.ok) throw new Error("ajout impossible");
    const today = "2026-11-23";
    const inQueue = async (day: string) =>
      callQueue(await listContacts(), day).some((i) => i.contact.id === r.contact.id);

    expect(await inQueue(today)).toBe(true);
    expect(await setFollowUp(r.contact.id, nextDay(today))).toMatchObject({ ok: true });
    expect(await inQueue(today)).toBe(false);
    expect(await inQueue("2026-11-24")).toBe(true);
  });
});
