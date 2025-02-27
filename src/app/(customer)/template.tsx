'use client';

export default function CustomerTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
      {children}
    </div>
  );
} 