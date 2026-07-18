import type { CropSuggestionsResponse } from "@ihiga-lite/shared";

export function CropSuggestionsCard({
  data,
  loading,
  error,
}: {
  data: CropSuggestionsResponse | null;
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return <p className="text-xs text-ink-faint">Loading crop suggestions…</p>;
  }
  if (error || !data) {
    return <p className="text-xs text-ink-faint">Crop suggestions unavailable right now.</p>;
  }
  if (data.crops.length === 0) {
    return <p className="text-xs text-ink-faint">Add your district at registration to see crop suggestions here.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-ink-faint">
        {data.season.englishName}
        {data.province ? ` — ${data.province}` : ""}
      </p>
      <ul className="space-y-1">
        {data.crops.map((crop) => (
          <li key={crop.name} className="text-ink">
            <span className="font-medium">{crop.name}</span>
            {crop.localName ? <span className="text-ink-faint"> ({crop.localName})</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
