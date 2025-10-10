import { db } from '@/db';
import { provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import Table from '@/components/Table';
import { Province } from '@/db/schema';
import { deleteProvince } from '@/server';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default async function ProvincesPage() {
  const data = await db.select().from(provinces);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Provinces</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold mb-6">Provinces</h1>
        <Link href="/admin/provinces/create" className="mb-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer">
          Add Province
        </Link>
        <Table
          data={data}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'code', header: 'Code' },
            { key: 'description', header: 'Description' },
            { key: 'createdAt', header: 'Created At', render: (value) => new Date(value).toLocaleDateString() },
          ]}
          actions={(item: Province) => (
            <div className="space-x-2">
              <Link href={`/admin/provinces/${item.id}`} className="text-primary cursor-pointer">View</Link>
              <Link href={`/admin/provinces/${item.id}/edit`} className="text-primary cursor-pointer">Edit</Link>
              <form action={deleteProvince} className="inline">
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="text-destructive cursor-pointer">Delete</button>
              </form>
            </div>
          )}
        />
      </div>
    </>
  );
}