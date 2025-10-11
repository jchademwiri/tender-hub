import { db } from '@/db';
import { provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteProvince } from '@/server';
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

interface PageProps {
  params: { id: string };
}

export default async function ProvinceView({ params }: PageProps) {
  const [province] = await db.select().from(provinces).where(eq(provinces.id, params.id));

  if (!province) notFound();

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
                <BreadcrumbLink href="/admin/provinces">
                  Provinces
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{province.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold mb-6">{province.name}</h1>
        <div className="space-y-2">
          <p><strong>Code:</strong> {province.code}</p>
          <p><strong>Description:</strong> {province.description}</p>
          <p><strong>Created At:</strong> {new Date(province.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="mt-6 space-x-4">
          <Link href={`/admin/provinces/${province.id}/edit`} className="px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer">
            Edit
          </Link>
          <form action={deleteProvince} className="inline">
            <input type="hidden" name="id" value={province.id} />
            <button type="submit" className="px-4 py-2 bg-destructive text-destructive-foreground rounded cursor-pointer">
              Delete
            </button>
          </form>
          <Link href="/admin/provinces" className="px-4 py-2 bg-secondary text-secondary-foreground rounded cursor-pointer">
            Back to List
          </Link>
        </div>
      </div>
    </>
  );
}