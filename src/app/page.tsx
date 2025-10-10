import Link from "next/link";

export default function Home() {
  return (
    <section className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1 className="text-4xl font-bold">Tender Hub</h1>
      <div className="flex gap-4">
        <Link href="/publishers" className="px-4 py-2 bg-primary text-primary-foreground rounded">
          Browse Publishers
        </Link>
        <Link href="/dashboard" className="px-4 py-2 bg-primary text-primary-foreground rounded">
          My Dashboard
        </Link>
      </div>
    </section>
  );
}
