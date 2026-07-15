import { requireAdminPage, getCurrentBusiness } from "@/lib/current-agent";
import { SettingsNav } from "@/components/settings-nav";
import { BusinessProfileForm } from "@/components/business-profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GeneralSettingsPage() {
  await requireAdminPage();
  const business = await getCurrentBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>
      <SettingsNav />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Business Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessProfileForm name={business.name} slug={business.slug} />
        </CardContent>
      </Card>
    </div>
  );
}
