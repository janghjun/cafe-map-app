import { useEffect, useState } from "react";
import type { Cafe } from "../types/cafe";
import { MascotImage } from "../components/MascotImage";
import { AttributeSummary } from "../components/AttributeSummary";
import { TagBadge } from "../components/TagBadge";
import { VerificationBadge } from "../components/VerificationBadge";
import { getCafeMapUrl } from "../utils/naverMap";
import { addRecentView } from "../services/recentViewService";
import { trackEvent } from "../services/logService";
import {
  getWifiReport,
  saveWifiReport,
  formatReportAge,
  type WifiReport,
  type WifiReportStatus,
} from "../services/wifiReportService";
import "../styles/pages.css";

function buildStudySummary(cafe: Cafe): string[] {
  const a = cafe.attributes;
  const sentences: string[] = [];
  const used = new Set<string>();

  // S1: 인원/좌석 특성 (항상 생성)
  const isSoloBetter = a.soloScore >= a.groupScore;
  if (a.soloScore >= 4 && a.outletScore >= 4) {
    sentences.push("1인 카공에 적합하고 콘센트 환경이 좋아요.");
    used.add("solo"); used.add("outlet");
  } else if (a.groupScore >= 4 && a.groupSeatScore >= 4) {
    sentences.push("그룹 스터디를 위한 단체석이 갖춰져 있어요.");
    used.add("group");
  } else if (isSoloBetter && a.soloScore >= 3) {
    sentences.push("혼자 공부하기 적합한 분위기예요.");
    used.add("solo");
  } else if (a.groupScore >= 3) {
    sentences.push("소그룹 이용이 가능한 공간이에요.");
    used.add("group");
  } else {
    sentences.push("카공 조건을 확인하고 방문해보세요.");
  }

  // S2: 영업/체류/분위기 (항상 생성)
  if (cafe.is24Hours) {
    sentences.push("24시간 운영해 언제든 방문 가능해요.");
  } else if (a.lateOpenScore >= 4) {
    sentences.push("늦은 시간까지 영업해 야간 카공도 가능해요.");
  } else if (a.stayScore >= 4) {
    sentences.push("오래 머물기 부담 없는 분위기예요.");
    used.add("stay");
  } else if (a.quietScore >= 4 && !used.has("quiet")) {
    sentences.push("조용한 분위기에서 집중하기 좋아요.");
    used.add("quiet");
  } else if (a.outletScore >= 4 && !used.has("outlet")) {
    sentences.push("콘센트 자리가 충분해 노트북 작업에도 편해요.");
    used.add("outlet");
  } else if (a.wifiScore >= 4) {
    sentences.push("와이파이 환경이 좋아 온라인 작업에도 문제없어요.");
  } else {
    sentences.push("체류 환경이 무난해 카공하기 괜찮은 공간이에요.");
  }

  // S3: 선택적 보너스
  if (sentences.length < 3) {
    if (a.quietScore >= 5 && !used.has("quiet")) {
      sentences.push("특히 조용해서 집중 환경이 좋아요.");
    } else if (a.stayScore >= 5 && !used.has("stay")) {
      sentences.push("장시간 체류에 부담 없는 공간이에요.");
    } else if (a.coffeeScore >= 5) {
      sentences.push("커피 퀄리티가 좋아 오래 머물어도 만족스러워요.");
    } else if (a.dessertScore >= 5) {
      sentences.push("디저트 종류가 다양해 쉬는 시간에 즐기기 좋아요.");
    }
  }

  return sentences.slice(0, 3);
}

type Props = {
  cafe: Cafe;
  distanceLabel?: string;
  onBack: () => void;
  onFavoriteClick?: (cafe: Cafe) => void;
  isFavorite?: boolean;
  onSuggestClick?: (cafeId: string, cafeName: string) => void;
};

export function CafeDetailPage({
  cafe,
  distanceLabel,
  onBack,
  onFavoriteClick,
  isFavorite = false,
  onSuggestClick,
}: Props) {
  useEffect(() => {
    addRecentView(cafe.id);
    trackEvent("cafe_detail_view", { cafeId: cafe.id, cafeDistrict: cafe.district });
  }, [cafe.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [wifiReport, setWifiReport] = useState<WifiReport | null>(() => getWifiReport(cafe.id));

  function handleWifiReport(status: WifiReportStatus) {
    const report = saveWifiReport(cafe.id, status);
    setWifiReport(report);
    trackEvent("wifi_reported", { cafeId: cafe.id, status });
  }

  const mapUrl = getCafeMapUrl(cafe);

  const studySummary = buildStudySummary(cafe);

  return (
    <div className="page detail-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
      </div>

      {/* 기본 정보 */}
      <section className="detail-section">
        <h1 className="detail-name">{cafe.name}</h1>
        <p className="detail-address">{cafe.address}</p>
        <div className="detail-meta">
          <span>{cafe.district}{cafe.dong && ` ${cafe.dong}`}</span>
          {distanceLabel && <><span className="detail-dot">·</span><span>{distanceLabel}</span></>}
          {cafe.is24Hours && <span className="detail-badge detail-badge--24h">24시간</span>}
        </div>
        {cafe.openHoursSummary && (
          <p className="detail-hours">{cafe.openHoursSummary}</p>
        )}
        <div className="detail-verification">
          <VerificationBadge status={cafe.verificationStatus} size="md" />
          {cafe.lastVerifiedAt && (
            <span className="detail-verified-date">
              {cafe.lastVerifiedAt.slice(0, 7).replace("-", ".") + " 기준"}
            </span>
          )}
        </div>
      </section>

      {/* 한 줄 요약 */}
      {cafe.summary && (
        <section className="detail-section">
          <p className="detail-summary">"{cafe.summary}"</p>
        </section>
      )}

      {/* 운영자 메모 — curated만 표시, needs_recheck는 안내 */}
      {cafe.verificationStatus === "curated" && cafe.curatorNote && (
        <section className="detail-section detail-section--curated">
          <h2 className="detail-section__label">⭐ 운영자 추천 메모</h2>
          <p className="detail-curator-note">{cafe.curatorNote}</p>
        </section>
      )}
      {cafe.verificationStatus === "needs_recheck" && (
        <section className="detail-section">
          <p className="detail-recheck-notice">⚠ 이 카페의 정보를 재확인 중이에요. 방문 전 직접 확인해 주세요.</p>
        </section>
      )}

      {/* 카공 적합도 요약 */}
      <section className="detail-section">
        <h2 className="detail-section__label">카공 적합도</h2>
        {studySummary.length > 0 && (
          <div className="detail-study-summary">
            {studySummary.map((s, i) => (
              <p key={i} className="detail-study-summary__line">{s}</p>
            ))}
          </div>
        )}
        <AttributeSummary cafe={cafe} />
      </section>

      {/* 태그 */}
      {cafe.tags.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section__label">카공 태그</h2>
          <div className="detail-tags">
            {cafe.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        </section>
      )}

      {/* 와이파이 제보 */}
      <section className="detail-section">
        <h2 className="detail-section__label">와이파이 상태</h2>
        <div className="wifi-report">
          <div className="wifi-report__actions">
            <button
              type="button"
              className={`wifi-report-btn wifi-report-btn--ok${wifiReport?.status === "ok" ? " wifi-report-btn--active" : ""}`}
              onClick={() => handleWifiReport("ok")}
            >
              괜찮아요
            </button>
            <button
              type="button"
              className={`wifi-report-btn wifi-report-btn--slow${wifiReport?.status === "slow" ? " wifi-report-btn--active" : ""}`}
              onClick={() => handleWifiReport("slow")}
            >
              느려요
            </button>
          </div>
          {wifiReport ? (
            <div className="wifi-report__feedback">
              <MascotImage
                state={wifiReport.status === "ok" ? "wifi" : "wifiBad"}
                size="sm"
                decorative
              />
              <p className="wifi-report__feedback-text">
                {wifiReport.status === "ok"
                  ? "빠른 와이파이라고 제보했어요"
                  : "느린 와이파이라고 제보했어요"}
                <span className="wifi-report__meta-inline"> · {formatReportAge(wifiReport.reportedAt)}</span>
              </p>
            </div>
          ) : (
            <p className="wifi-report__meta">방문 후 와이파이 상태를 제보해 주세요.</p>
          )}
          <p className="wifi-report__hint">내 기기에만 저장되며 즉시 공개되지 않아요.</p>
        </div>
      </section>

      {/* 정보 수정 제안 */}
      {onSuggestClick && (
        <section className="detail-section detail-suggest-section">
          <div className="detail-suggest-section__body">
            <span className="detail-suggest-section__icon">✏️</span>
            <div className="detail-suggest-section__text">
              <p className="detail-suggest-section__title">정보가 달라졌나요?</p>
              <p className="detail-suggest-section__desc">운영 시간, 콘센트, 환경 등 변경된 내용을 알려주세요.</p>
            </div>
          </div>
          <button
            type="button"
            className="detail-suggest-section__btn"
            onClick={() => onSuggestClick(cafe.id, cafe.name)}
          >
            수정 제안하기
          </button>
        </section>
      )}

      {/* 데이터 기준 안내 */}
      <div className="page-footer-link">
        <p className="detail-footnote">카공 적합도는 직접 수집한 기준이에요. 실제 운영 상황은 방문 전 확인해주세요.</p>
      </div>

      {/* Sticky CTA */}
      <div className="detail-sticky-cta">
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="detail-sticky-cta__map"
          onClick={() => trackEvent("direction_click", {
            cafeId: cafe.id,
            cafeDistrict: cafe.district,
            source: cafe.naverMapUrl ? "direct" : "search",
          })}
        >
          네이버 지도에서 보기
        </a>
        {onFavoriteClick && (
          <button
            type="button"
            className={`detail-sticky-cta__fav${isFavorite ? " detail-sticky-cta__fav--active" : ""}`}
            onClick={() => onFavoriteClick(cafe)}
            aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={isFavorite}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        )}
      </div>
    </div>
  );
}
