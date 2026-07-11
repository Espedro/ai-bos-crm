import { getCompanies } from "@/lib/actions/companies";
import { NewCompanyDialog } from "@/components/new-company-dialog";
import { CompaniesTable } from "@/components/companies-table";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            {companies.length} total companies
          </p>
        </div>
        <NewCompanyDialog />
      </div>

      <CompaniesTable companies={companies} />
    </div>
  );
}
