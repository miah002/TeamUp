import Link from "next/link";
import NewTalentForm from "./NewTalentForm";

export default function NewTalentPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/admin/talents" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Talents
      </Link>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Add New Talent</h1>
        <NewTalentForm />
      </div>
    </div>
  );
}
