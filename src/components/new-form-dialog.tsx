"use client";

import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { createForm } from "@/lib/actions/forms";

type FieldType = "text" | "textarea" | "select";

type CustomField = {
  key: string;
  label: string;
  type: FieldType;
  options: string; // comma-separated, only used when type === "select"
};

export function NewFormDialog() {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<CustomField[]>([]);
  const genId = useId();

  function addField() {
    setFields((prev) => [
      ...prev,
      { key: `${genId}-${prev.length}-${Date.now()}`, label: "", type: "text", options: "" },
    ]);
  }

  function updateField(key: string, patch: Partial<CustomField>) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  function removeField(key: string) {
    setFields((prev) => prev.filter((f) => f.key !== key));
  }

  const customFieldsJson = JSON.stringify(
    fields
      .filter((f) => f.label.trim())
      .map((f) => ({
        label: f.label.trim(),
        type: f.type,
        ...(f.type === "select"
          ? { options: f.options.split(",").map((o) => o.trim()).filter(Boolean) }
          : {}),
      }))
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFields([]);
      }}
    >
      <DialogTrigger render={<Button />}>New Form</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Lead-Capture Form</DialogTitle>
        </DialogHeader>
        <form action={createForm} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-name">Form name</Label>
            <Input id="form-name" name="name" placeholder="e.g. Newsletter Signup" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-description">Description (optional)</Label>
            <Textarea id="form-description" name="description" rows={2} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="collectPhone" defaultChecked className="size-4" />
              Collect phone
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="collectMessage" defaultChecked className="size-4" />
              Collect message
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Extra fields — ask for whatever you need</Label>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                + Add Field
              </Button>
            </div>
            {fields.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No extra fields yet. Add one for anything beyond name/email — company, budget,
                appointment date, etc.
              </p>
            )}
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.key} className="flex items-start gap-2 rounded-lg border p-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Field label (e.g. Company)"
                      value={field.label}
                      onChange={(e) => updateField(field.key, { label: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          updateField(field.key, { type: value as FieldType })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Short text</SelectItem>
                          <SelectItem value="textarea">Paragraph</SelectItem>
                          <SelectItem value="select">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.type === "select" && (
                        <Input
                          placeholder="Options, comma-separated"
                          value={field.options}
                          onChange={(e) => updateField(field.key, { options: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.key)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <input type="hidden" name="customFieldsJson" value={customFieldsJson} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-tag">Tag applied to contacts (optional)</Label>
            <Input id="form-tag" name="tagOnSubmit" placeholder="e.g. newsletter" />
          </div>
          <Button type="submit" className="w-full">
            Create Form
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
