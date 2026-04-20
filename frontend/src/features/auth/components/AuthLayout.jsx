export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-1/2 bg-gradient-to-tr from-primary to-highlight p-10">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="mt-4 text-gray-300">{subtitle}</p>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}