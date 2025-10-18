
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppBreadcrumbs } from '@/components/app-breadcrumbs';

export default function ProfilePage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <AppBreadcrumbs />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="w-full max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <p className="text-muted-foreground">Profile content goes here</p>
          </div>
        </div>
      </div>
    </>
  );
}