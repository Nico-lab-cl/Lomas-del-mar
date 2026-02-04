export const StatusLegend = () => {
  const statuses = [
    { label: 'DISPONIBLE', color: 'bg-lot-available' },
    { label: 'RESERVADO', color: 'bg-lot-reserved' },
    { label: 'VENDIDO', color: 'bg-lot-sold' },
    { label: 'TU SELECCIÓN', color: 'bg-lot-selected' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-6">
      {statuses.map((status) => (
        <div key={status.label} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status.color}`} />
          <span className="text-xs font-medium text-muted-foreground">{status.label}</span>
        </div>
      ))}
    </div>
  );
};
