"use client";

import ReportCard from "./ReportCard";

export default function ReportsList({ reports, error }) {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error cargando reportes: {error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-gray-600 text-center py-8">
        No hay reportes disponibles
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
