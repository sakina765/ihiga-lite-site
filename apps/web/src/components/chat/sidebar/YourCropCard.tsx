import type { CurrentCropResponse } from "@ihiga-lite/shared";

export function YourCropCard({
  data,
  loading,
  error,
}: {
  data: CurrentCropResponse | null;
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return <p className="text-xs text-ink-faint">Loading your crop…</p>;
  }
  if (error) {
    return <p className="text-xs text-ink-faint">Crop status unavailable right now.</p>;
  }
  if (!data) {
    return <p className="text-xs text-ink-faint">Tell Ihiga your crop and planting date in chat to track its stage here.</p>;
  }

  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium text-ink">
        {data.cropName} <span className="text-ink-faint">({data.localName})</span>
      </p>
      <p className="text-ink-soft">
        Stage: {data.stage.name} (week {data.stage.weekStart}–{data.stage.weekEnd})
      </p>
      <p className="text-xs text-ink-faint">{data.stage.taskDescription}</p>
    </div>
  );
}
