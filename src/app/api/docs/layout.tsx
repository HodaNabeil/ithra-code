export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="ltr" lang="en" className="api-docs-ltr min-h-screen bg-white">
      {children}
    </div>
  );
}
