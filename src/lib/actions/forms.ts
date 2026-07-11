"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_COVER_IMAGE_BYTES = 2 * 1024 * 1024;

function readCoverImage(formData: FormData): string | null {
  const value = String(formData.get("coverImageUrl") ?? "").trim();
  if (!value) return null;
  if (!value.startsWith("data:image/")) return null;
  if (value.length > MAX_COVER_IMAGE_BYTES * 1.4) {
    throw new Error("Cover image is too large (2MB max)");
  }
  return value;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "form"
  );
}

export async function getForms() {
  return prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
}

export async function getForm(id: string) {
  return prisma.form.findUnique({
    where: { id },
    include: {
      submissions: { orderBy: { createdAt: "desc" }, include: { contact: true } },
    },
  });
}

export async function getFormBySlug(slug: string) {
  return prisma.form.findUnique({ where: { slug } });
}

export async function createForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.form.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const customFieldsRaw = String(formData.get("customFieldsJson") ?? "[]");
  let customFields: unknown;
  try {
    customFields = JSON.parse(customFieldsRaw);
  } catch {
    customFields = [];
  }
  if (!Array.isArray(customFields)) customFields = [];

  const form = await prisma.form.create({
    data: {
      name,
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      coverImageUrl: readCoverImage(formData),
      collectPhone: formData.get("collectPhone") === "on",
      collectMessage: formData.get("collectMessage") === "on",
      customFields: JSON.stringify(customFields),
      tagOnSubmit: String(formData.get("tagOnSubmit") ?? "").trim() || null,
    },
  });

  revalidatePath("/forms");
  redirect(`/forms/${form.id}`);
}

export async function deleteForm(id: string) {
  await prisma.form.delete({ where: { id } });
  revalidatePath("/forms");
}

export async function updateFormCoverImage(id: string, dataUrl: string | null) {
  if (dataUrl && dataUrl.length > MAX_COVER_IMAGE_BYTES * 1.4) {
    throw new Error("Cover image is too large (2MB max)");
  }
  if (dataUrl && !dataUrl.startsWith("data:image/")) {
    throw new Error("Invalid image");
  }
  await prisma.form.update({ where: { id }, data: { coverImageUrl: dataUrl } });
  revalidatePath(`/forms/${id}`);
}

/**
 * Public submission handler for /form/[slug]. Upserts a Contact by email
 * (when provided) so repeat submissions and mailing-list segmentation work
 * off the same CRM record, and always keeps the raw submitted values on
 * FormSubmission for reference.
 */
export async function submitForm(slug: string, formData: FormData) {
  const form = await prisma.form.findUniqueOrThrow({ where: { slug } });

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = form.collectPhone ? String(formData.get("phone") ?? "").trim() || null : null;
  const message = form.collectMessage ? String(formData.get("message") ?? "").trim() : null;

  const customFields: { label: string; type?: string; options?: string[] }[] = JSON.parse(
    form.customFields
  );
  const customValues: Record<string, string> = {};
  for (const field of customFields) {
    const value = String(formData.get(`custom_${field.label}`) ?? "").trim();
    if (value) customValues[field.label] = value;
  }

  let contact = email ? await prisma.contact.findFirst({ where: { email } }) : null;

  if (contact) {
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        phone: phone ?? contact.phone,
        tags: form.tagOnSubmit
          ? Array.from(new Set([...contact.tags.split(",").filter(Boolean), form.tagOnSubmit])).join(",")
          : contact.tags,
      },
    });
  } else {
    contact = await prisma.contact.create({
      data: {
        firstName: firstName || "Form",
        lastName: lastName || "Submission",
        email,
        phone,
        tags: form.tagOnSubmit ?? "",
      },
    });
  }

  await prisma.formSubmission.create({
    data: {
      formId: form.id,
      contactId: contact.id,
      data: JSON.stringify({ firstName, lastName, email, phone, message, ...customValues }),
    },
  });

  revalidatePath(`/forms/${form.id}`);
  redirect(`/form/${slug}/thank-you`);
}
