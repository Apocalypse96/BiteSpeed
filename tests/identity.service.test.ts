import { PrismaClient } from "@prisma/client";
import { identityService } from "../src/services/identity.service";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.contact.deleteMany();
});

afterAll(async () => {
  await prisma.contact.deleteMany();
  await prisma.$disconnect();
});

describe("Identity Service", () => {
  test("creates a new primary contact when no matches exist", async () => {
    const result = await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "111111",
    });

    expect(result.contact.emails).toEqual(["doc@future.com"]);
    expect(result.contact.phoneNumbers).toEqual(["111111"]);
    expect(result.contact.secondaryContactIds).toEqual([]);
  });

  test("handles email-only request", async () => {
    const result = await identityService.identify({
      email: "doc@future.com",
    });

    expect(result.contact.emails).toEqual(["doc@future.com"]);
    expect(result.contact.phoneNumbers).toEqual([]);
    expect(result.contact.secondaryContactIds).toEqual([]);
  });

  test("handles phone-only request", async () => {
    const result = await identityService.identify({
      phoneNumber: "111111",
    });

    expect(result.contact.emails).toEqual([]);
    expect(result.contact.phoneNumbers).toEqual(["111111"]);
    expect(result.contact.secondaryContactIds).toEqual([]);
  });

  test("creates a secondary contact on partial match", async () => {
    // First: create primary
    await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "111111",
    });

    // Second: same phone, different email -> secondary
    const result = await identityService.identify({
      email: "marty@future.com",
      phoneNumber: "111111",
    });

    expect(result.contact.emails).toEqual([
      "doc@future.com",
      "marty@future.com",
    ]);
    expect(result.contact.phoneNumbers).toEqual(["111111"]);
    expect(result.contact.secondaryContactIds).toHaveLength(1);
  });

  test("merges two primary clusters", async () => {
    // Create two separate primary contacts
    const first = await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "111111",
    });
    const second = await identityService.identify({
      email: "marty@future.com",
      phoneNumber: "222222",
    });

    // Now link them: email from first, phone from second
    const result = await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "222222",
    });

    expect(result.contact.primaryContatctId).toBe(
      first.contact.primaryContatctId
    );
    expect(result.contact.emails).toContain("doc@future.com");
    expect(result.contact.emails).toContain("marty@future.com");
    expect(result.contact.phoneNumbers).toContain("111111");
    expect(result.contact.phoneNumbers).toContain("222222");
    expect(result.contact.secondaryContactIds).toContain(
      second.contact.primaryContatctId
    );
  });

  test("is idempotent for duplicate submissions", async () => {
    await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "111111",
    });

    const result = await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "111111",
    });

    expect(result.contact.emails).toEqual(["doc@future.com"]);
    expect(result.contact.phoneNumbers).toEqual(["111111"]);
    expect(result.contact.secondaryContactIds).toEqual([]);
  });

  test("response has no duplicate emails or phone numbers", async () => {
    await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "111111",
    });

    await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "222222",
    });

    const result = await identityService.identify({
      email: "doc@future.com",
      phoneNumber: "111111",
    });

    const uniqueEmails = new Set(result.contact.emails);
    const uniquePhones = new Set(result.contact.phoneNumbers);

    expect(uniqueEmails.size).toBe(result.contact.emails.length);
    expect(uniquePhones.size).toBe(result.contact.phoneNumbers.length);
  });
});
