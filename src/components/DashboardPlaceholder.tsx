interface DashboardPlaceholderProps {
  title: string;
}

export function DashboardPlaceholder({ title }: DashboardPlaceholderProps) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <p className="text-lg">{title}</p>
    </div>
  );
}
