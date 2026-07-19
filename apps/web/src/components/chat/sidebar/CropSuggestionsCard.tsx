import type { CropSuggestionsResponse } from "@ihiga-lite/shared";
import { EmptyStatePrompt } from "./EmptyStatePrompt";
import { useLanguage } from "../../../i18n/LanguageProvider";

export function CropSuggestionsCard({
  data,
  loading,
  error,
}: {
  data: CropSuggestionsResponse | null;
  loading: boolean;
  error: boolean;
}) {
  const { t } = useLanguage();

  if (loading) {
    return <p className="text-xs text-ink-faint">{t("sidebar.cropSuggestions.loading")}</p>;
  }
  if (error || !data) {
    return <p className="text-xs text-ink-faint">{t("sidebar.cropSuggestions.unavailable")}</p>;
  }
  if (data.crops.length === 0) {
    return <EmptyStatePrompt icon="🌱" label={t("sidebar.cropSuggestions.empty")} />;
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
