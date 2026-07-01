// app/terms-and-conditions/page.tsx

import dbConnect from "@/lib/mongodb";
import PageContent from "@/models/PageContent";

export const revalidate = 0;

export default async function TermsAndConditionsPage() {
  await dbConnect();
  const doc = await PageContent.findById("terms-and-conditions").lean();
  const sections = doc?.sections ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl text-center font-bold text-gray-900 mb-8">Terms and Conditions</h1>
      {sections.length === 0 ? (
        <p className="text-gray-400 text-sm">Content coming soon.</p>
      ) : (
        <div className="space-y-6">
          {sections.map((s: any, i: any) => (
            <div key={i}>
              {s.h3 && <h3 className="text-lg font-semibold text-gray-800 mb-1.5">{s.h3}</h3>}
              {s.p && <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{s.p}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}