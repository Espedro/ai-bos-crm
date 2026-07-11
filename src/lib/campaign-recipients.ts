import type { ContactStatus, Prisma } from "@prisma/client";

export function recipientWhere(
  businessId: string,
  filterTag: string | null,
  filterStatus: ContactStatus | null
) {
  const where: Prisma.ContactWhereInput = { businessId, email: { not: null } };
  if (filterTag) where.tags = { contains: filterTag };
  if (filterStatus) where.status = filterStatus;
  return where;
}
