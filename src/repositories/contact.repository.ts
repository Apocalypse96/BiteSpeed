import { Contact, Prisma } from "@prisma/client";
import prisma from "../db/prisma";

export const contactRepository = {
  async findByEmailOrPhone(
    email?: string | null,
    phoneNumber?: string | null
  ): Promise<Contact[]> {
    const conditions: Prisma.ContactWhereInput[] = [];

    if (email) {
      conditions.push({ email });
    }
    if (phoneNumber) {
      conditions.push({ phoneNumber });
    }

    if (conditions.length === 0) return [];

    return prisma.contact.findMany({
      where: {
        OR: conditions,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async findContactsByPrimaryIds(primaryIds: number[]): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: {
        OR: [
          { id: { in: primaryIds }, deletedAt: null },
          { linkedId: { in: primaryIds }, deletedAt: null },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async createContact(
    data: Prisma.ContactCreateInput
  ): Promise<Contact> {
    return prisma.contact.create({ data });
  },

  async convertToPrimarySecondary(
    idsToConvert: number[],
    newPrimaryId: number
  ): Promise<void> {
    await prisma.$transaction([
      // Convert the primary contacts to secondary
      prisma.contact.updateMany({
        where: { id: { in: idsToConvert } },
        data: {
          linkedId: newPrimaryId,
          linkPrecedence: "secondary",
        },
      }),
      // Re-link their secondaries to the new primary
      prisma.contact.updateMany({
        where: { linkedId: { in: idsToConvert } },
        data: { linkedId: newPrimaryId },
      }),
    ]);
  },
};
