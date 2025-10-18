
export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="w-full max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <p className="text-muted-foreground">Profile content goes here</p>
          </div>
        </div>
    </div>
  );
}