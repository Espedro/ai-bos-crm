import { notFound } from "next/navigation";
import { getFormBySlug, submitForm } from "@/lib/actions/forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CustomField = { label: string; type?: "text" | "textarea" | "select"; options?: string[] };

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);
  if (!form) notFound();

  const customFields: CustomField[] = JSON.parse(form.customFields);
  const submitFormWithSlug = submitForm.bind(null, slug);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-12">
      <Card className="w-full">
        {form.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.coverImageUrl}
            alt=""
            className="h-40 w-full object-cover sm:h-52"
          />
        )}
        <CardHeader>
          <CardTitle className="text-2xl">{form.name}</CardTitle>
          {form.description && (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <form action={submitFormWithSlug} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {form.collectPhone && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
            )}
            {customFields.map((field) => (
              <div className="space-y-2" key={field.label}>
                <Label htmlFor={`custom_${field.label}`}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea id={`custom_${field.label}`} name={`custom_${field.label}`} rows={3} />
                ) : field.type === "select" ? (
                  <Select name={`custom_${field.label}`}>
                    <SelectTrigger id={`custom_${field.label}`}>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id={`custom_${field.label}`} name={`custom_${field.label}`} />
                )}
              </div>
            ))}
            {form.collectMessage && (
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" rows={4} />
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
