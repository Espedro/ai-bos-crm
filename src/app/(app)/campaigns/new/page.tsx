import { createCampaign } from "@/lib/actions/campaigns";
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

export default function NewCampaignPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Campaign</h1>
        <p className="text-sm text-muted-foreground">
          Compose an email and choose who receives it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign name (internal)</Label>
              <Input id="name" name="name" placeholder="e.g. July Promo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject line</Label>
              <Input id="subject" name="subject" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Email body (HTML)</Label>
              <Textarea
                id="body"
                name="body"
                rows={10}
                placeholder="<p>Hi there...</p>"
                required
              />
              <p className="text-xs text-muted-foreground">
                Basic HTML supported. Links and an open-tracking pixel are added automatically
                when the campaign sends.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="filterTag">Only Contacts tagged (optional)</Label>
                <Input id="filterTag" name="filterTag" placeholder="e.g. newsletter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterStatus">Only status (optional)</Label>
                <Select name="filterStatus">
                  <SelectTrigger id="filterStatus">
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="QUALIFIED">Qualified</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Create Draft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
