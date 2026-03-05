import { Contact } from "@prisma/client";
import { contactRepository } from "../repositories/contact.repository";
import { IdentifyRequest, IdentifyResponse } from "../types";

export const identityService = {
  async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    if (!email && !phoneNumber) {
      throw new Error("At least one of email or phoneNumber must be provided");
    }

    // 1. Find all contacts matching email OR phoneNumber
    const matchingContacts = await contactRepository.findByEmailOrPhone(
      email,
      phoneNumber
    );

    // 2. No matches — create a new primary contact
    if (matchingContacts.length === 0) {
      const newContact = await contactRepository.createContact({
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: "primary",
      });
      return buildResponse(newContact, []);
    }

    // 3. Resolve all unique primary IDs
    const primaryIds = new Set<number>();
    for (const contact of matchingContacts) {
      if (contact.linkPrecedence === "primary") {
        primaryIds.add(contact.id);
      } else if (contact.linkedId) {
        primaryIds.add(contact.linkedId);
      }
    }

    // 4. Fetch full clusters for all primary IDs
    const allContacts = await contactRepository.findContactsByPrimaryIds(
      Array.from(primaryIds)
    );

    // 5. Determine the true primary (oldest createdAt)
    const primaries = allContacts.filter(
      (c) => c.linkPrecedence === "primary"
    );
    primaries.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    const truePrimary = primaries[0];

    // 6. If multiple primaries exist, merge them
    if (primaries.length > 1) {
      const idsToConvert = primaries.slice(1).map((c) => c.id);
      await contactRepository.convertToPrimarySecondary(
        idsToConvert,
        truePrimary.id
      );
    }

    // 7. Check if the request introduces new information
    const clusterEmails = new Set(
      allContacts.map((c) => c.email).filter(Boolean)
    );
    const clusterPhones = new Set(
      allContacts.map((c) => c.phoneNumber).filter(Boolean)
    );

    const hasNewEmail = email && !clusterEmails.has(email);
    const hasNewPhone = phoneNumber && !clusterPhones.has(phoneNumber);

    if (hasNewEmail || hasNewPhone) {
      await contactRepository.createContact({
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: "secondary",
        linkedContact: { connect: { id: truePrimary.id } },
      });
    }

    // 8. Fetch final cluster and build response
    const finalContacts = await contactRepository.findContactsByPrimaryIds([
      truePrimary.id,
    ]);

    const finalPrimary = finalContacts.find(
      (c) => c.id === truePrimary.id
    )!;
    const secondaries = finalContacts.filter(
      (c) => c.id !== truePrimary.id
    );

    return buildResponse(finalPrimary, secondaries);
  },
};

function buildResponse(
  primary: Contact,
  secondaries: Contact[]
): IdentifyResponse {
  const emails: string[] = [];
  const phoneNumbers: string[] = [];
  const secondaryContactIds: number[] = [];

  // Primary's info first
  if (primary.email) emails.push(primary.email);
  if (primary.phoneNumber) phoneNumbers.push(primary.phoneNumber);

  // Then secondaries ordered by createdAt (already sorted from DB)
  for (const contact of secondaries) {
    if (contact.email && !emails.includes(contact.email)) {
      emails.push(contact.email);
    }
    if (
      contact.phoneNumber &&
      !phoneNumbers.includes(contact.phoneNumber)
    ) {
      phoneNumbers.push(contact.phoneNumber);
    }
    secondaryContactIds.push(contact.id);
  }

  return {
    contact: {
      primaryContatctId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
}
