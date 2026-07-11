import type { ContactStatus, Prisma } from "@prisma/client";

export function recipientWhere(filterTag: string | null, filterStatus: ContactStatus | null) {
  const where: Prisma.ContactWhereInput = { email: { not: null } };
  if (filterTag) where.tags = { contains: filterTag };
  if (filterStatus) where.status = filterStatus;
  return where;
}
