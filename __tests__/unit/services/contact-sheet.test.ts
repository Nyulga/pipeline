import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/contacts", () => ({ getContact: vi.fn() }));
vi.mock("@/services/notes", () => ({ listNotes: vi.fn() }));

import { getContactSheet } from "@/services/contact-sheet";
import { getContact } from "@/services/contacts";
import { listNotes } from "@/services/notes";

const contact = {
  id: "c1",
  name: "Claire Martin",
  company: null,
  phone: null,
  email: null,
  called: false,
  response: "enAttente" as const,
  nextFollowUp: null,
  createdAt: "2026-11-01T09:00:00.000Z",
};

beforeEach(() => {
  vi.mocked(getContact).mockReset();
  vi.mocked(listNotes).mockReset();
});

describe("getContactSheet (lot 9)", () => {
  it("rassemble le contact et ses notes", async () => {
    const notes = [{ id: "n1", contactId: "c1", body: "Rappeler", createdAt: "2026-11-02T09:00:00.000Z" }];
    vi.mocked(getContact).mockResolvedValue(contact);
    vi.mocked(listNotes).mockResolvedValue(notes);
    expect(await getContactSheet("c1")).toEqual({ contact, notes });
    expect(listNotes).toHaveBeenCalledWith("c1");
  });

  it("contact introuvable : null, sans lire de notes", async () => {
    vi.mocked(getContact).mockResolvedValue(null);
    expect(await getContactSheet("x")).toBeNull();
    expect(listNotes).not.toHaveBeenCalled();
  });
});
