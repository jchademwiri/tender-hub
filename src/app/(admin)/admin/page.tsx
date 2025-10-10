import { db } from '@/db';
import { provinces, publishers } from '@/db/schema';
import { count } from 'drizzle-orm';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default async function AdminDashboard() {
  const [provinceCount] = await db.select({ count: count() }).from(provinces);
  const [publisherCount] = await db.select({ count: count() }).from(publishers);

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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-muted p-4 rounded">
            <h2 className="text-xl">Provinces</h2>
            <p className="text-2xl">{provinceCount.count}</p>
          </div>
          <div className="bg-muted p-4 rounded">
            <h2 className="text-xl">Publishers</h2>
            <p className="text-2xl">{publisherCount.count}</p>
          </div>
        </div>
      </div>
    </>
  );
}