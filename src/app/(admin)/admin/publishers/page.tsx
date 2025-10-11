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
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, Eye, Pencil, Trash2 } from "lucide-react"

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Publishers</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Publishers</h1>
          <Button asChild>
            <Link href="/admin/publishers/create">
              <Plus /> Add Publisher
            </Link>
          </Button>
        </div>
        <Table
          data={data}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'website', header: 'Website', render: (value) => value ? <a href={value} target="_blank" className="text-blue-500">{value}</a> : 'N/A' },
            { key: 'provinceName', header: 'Province' },
            { key: 'createdAt', header: 'Created At', render: (value) => new Date(value).toLocaleDateString() },
          ]}
          actions={(item: any) => (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/publishers/${item.id}`}>
                  <Eye /> View
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/publishers/${item.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
              <form action={deletePublisher} className="inline">
                <input type="hidden" name="id" value={item.id} />
                <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive">
                  <Trash2 /> Delete
                </Button>
              </form>
            </div>
          )}
        />
      </div>
    </>
  );
}