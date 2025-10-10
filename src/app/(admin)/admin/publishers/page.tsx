import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import Table from '@/components/Table';
import { Publisher } from '@/db/schema';
import { deletePublisher } from '@/server';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default async function PublishersPage() {
  const data = await db
    .select({
      id: publishers.id,
      name: publishers.name,
      website: publishers.website,
      province_id: publishers.province_id,
      createdAt: publishers.createdAt,
      provinceName: provinces.name,
    })
    .from(publishers)
    .leftJoin(provinces, eq(publishers.province_id, provinces.id));

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
                <BreadcrumbPage>Publishers</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold mb-6">Publishers</h1>
        <Link href="/admin/publishers/create" className="mb-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer">
          Add Publisher
        </Link>
        <Table
          data={data}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'website', header: 'Website', render: (value) => value ? <a href={value} target="_blank" className="text-blue-500">{value}</a> : 'N/A' },
            { key: 'provinceName', header: 'Province' },
            { key: 'createdAt', header: 'Created At', render: (value) => new Date(value).toLocaleDateString() },
          ]}
          actions={(item: any) => (
            <div className="space-x-2">
              <Link href={`/admin/publishers/${item.id}`} className="text-primary cursor-pointer">View</Link>
              <Link href={`/admin/publishers/${item.id}/edit`} className="text-primary cursor-pointer">Edit</Link>
              <form action={deletePublisher} className="inline">
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