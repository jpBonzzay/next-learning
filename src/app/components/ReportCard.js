"use client";

export default function ReportCard({ report }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
      <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
      <p className="text-gray-600 mt-2">{report.content}</p>
      <p className="text-sm text-gray-400 mt-2">
        {new Date(report.created_at).toLocaleString()}
      </p>
    </div>
  );
}
