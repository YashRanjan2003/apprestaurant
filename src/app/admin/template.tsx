'use client';

export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white w-full">
      {children}
    </div>
  );
} 