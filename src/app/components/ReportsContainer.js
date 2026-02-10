import { supabase } from "@/lib/supabase";
import ReportsList from "./ReportsList";

export default async function ReportsContainer() {
  let reports = [];
  let error = null;

  try {
    const { data, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;
    reports = data || [];
  } catch (err) {
    console.error("Error fetching reports:", err);
    error = err.message;
  }

  return <ReportsList reports={reports} error={error} />;
}
