export type WifiReportStatus = "ok" | "slow";

export type WifiReport = {
  status: WifiReportStatus;
  reportedAt: string; // ISO string
};

const storageKey = (cafeId: string) => `wifi_report_${cafeId}`;

export function getWifiReport(cafeId: string): WifiReport | null {
  try {
    const raw = localStorage.getItem(storageKey(cafeId));
    return raw ? (JSON.parse(raw) as WifiReport) : null;
  } catch {
    return null;
  }
}

export function saveWifiReport(cafeId: string, status: WifiReportStatus): WifiReport {
  const report: WifiReport = { status, reportedAt: new Date().toISOString() };
  try {
    localStorage.setItem(storageKey(cafeId), JSON.stringify(report));
  } catch {
    // localStorage 쓰기 실패 무시 (private 모드 등)
  }
  return report;
}

export function formatReportAge(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}
