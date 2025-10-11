import { db } from '@/db';
import { publishers, provinces, Publisher } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PublisherForm from '@/components/PublisherForm';
import { notFound } from 'next/navigation';
import { updatePublisher } from '@/server';
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

export default async function EditPublisher({ params }: PageProps) {
  const { id } = await params;
  const [publisher] = await db
    .select()
    .from(publishers)
    .where(eq(publishers.id, id)) as Publisher[];

  if (!publisher) notFound();

  const provincesList = await db.select().from(provinces);

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
                <BreadcrumbLink href="/admin/publishers">
                  Publishers
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/admin/publishers/${publisher.id}`}>
                  {publisher.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold mb-6">Edit Publisher</h1>
        <PublisherForm publisher={publisher} provinces={provincesList} action={updatePublisher} />
      </div>
    </>
  );
}
