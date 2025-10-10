import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center max-w-5xl mx-auto py-20">
        <h1 className="text-5xl font-bold mb-6">Welcome to Tender Hub</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover and connect with tender publishers across all South African provinces.
          Find opportunities, manage your dashboard, and stay updated with the latest tenders.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/publishers" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
            Browse Publishers
          </Link>
          <Link href="/dashboard" className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer">
            My Dashboard
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Tender Hub?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">Comprehensive Coverage</h3>
            <p className="text-muted-foreground">
              Access tender publishers from all 9 South African provinces in one centralized platform.
            </p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">Easy Navigation</h3>
            <p className="text-muted-foreground">
              Intuitive interface to browse, search, and manage tender information effortlessly.
            </p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">Admin Control</h3>
            <p className="text-muted-foreground">
              Powerful admin tools to manage provinces and publishers with full CRUD operations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-muted/50 rounded-lg max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands of users discovering tender opportunities across South Africa.
        </p>
        <Link href="/publishers" className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg hover:bg-primary/90 transition-colors cursor-pointer">
          Explore Publishers
        </Link>
      </section>
       
    </div>
  );
}
