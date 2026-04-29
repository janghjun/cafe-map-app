import { useState, useEffect } from "react";
import type { Cafe } from "../types/cafe";
import { getCafes, getCafesByDistrict } from "../services/cafeService";
import { getCafeHighlights } from "../utils/cafeHighlights";
import { searchCafes } from "../utils/searchCafes";
import { CafeCard } from "../components/CafeCard";
import { FilterChip } from "../components/FilterChip";
import { SearchInput } from "../components/SearchInput";
import { EmptyState } from "../components/EmptyState";
import { trackEvent } from "../services/logService";
import "../styles/pages.css";

const BEST_LIMIT = 5;

function calcBestScore(cafe: Cafe): number {
  const a = cafe.attributes;
  return (
    Math.max(a.soloScore, a.groupScore) +
    a.quietScore +
    a.outletScore +
    a.stayScore +
    a.wifiScore +
    a.coffeeScore +
    a.dessertScore
  );
}

function getDistricts(cafes: Cafe[]): string[] {
  return [...new Set(cafes.map((c) => c.district))].sort();
}

function getDongs(cafes: Cafe[], district: string): string[] {
  return [...new Set(
    cafes.filter((c) => c.district === district).map((c) => c.dong)
  )].sort();
}

type Props = {
  onCafeClick: (cafe: Cafe, distanceLabel?: string) => void;
  onBack: () => void;
};

export function DistrictBestPage({ onCafeClick, onBack }: Props) {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedDong, setSelectedDong] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { trackEvent("district_best_view"); }, []);

  const allCafes = getCafes();
  const activeCafes = allCafes.filter((c) => c.status === "active");
  const districts = getDistricts(activeCafes);
  const dongs = selectedDistrict ? getDongs(activeCafes, selectedDistrict) : [];

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching ? searchCafes(allCafes, searchQuery) : [];

  function handleDistrictClick(district: string) {
    setSelectedDistrict(district);
    setSelectedDong("전체");
    setSearchQuery("");
    trackEvent("district_selected", { district });
  }

  function handleDongClick(dong: string) {
    setSelectedDong(dong);
    if (selectedDistrict && dong !== "전체") {
      trackEvent("dong_selected", { district: selectedDistrict, dong });
    }
  }

  const filteredCafes = selectedDistrict
    ? getCafesByDistrict(selectedDistrict, selectedDong !== "전체" ? selectedDong : undefined)
    : [];

  const rankedCafes = [...filteredCafes]
    .sort((a, b) => calcBestScore(b) - calcBestScore(a))
    .slice(0, BEST_LIMIT);

  return (
    <div className="page district-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
      </div>

      <header className="district-header">
        <h1 className="district-title">인천 BEST</h1>
        <p className="district-subtitle">구/동을 선택하거나 카페명·동네로 검색해보세요</p>
      </header>

      {/* 검색 */}
      <section className="home-section">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setSelectedDistrict(null); }}
        />
      </section>

      {/* 검색 결과 */}
      {isSearching && (
        <section className="district-result">
          {searchResults.length === 0 ? (
            <EmptyState
              title="검색 결과가 없어요"
              description="카페명, 구, 동, 태그로 검색할 수 있어요."
            />
          ) : (
            <>
              <p className="district-result__summary">
                검색 결과 {searchResults.length}곳
              </p>
              <div className="cafe-list">
                {searchResults.map((cafe) => (
                  <CafeCard
                    key={cafe.id}
                    cafe={cafe}
                    highlights={getCafeHighlights(cafe)}
                    onClick={(c) => {
                      trackEvent("cafe_card_click", { cafeId: c.id, cafeDistrict: c.district });
                      onCafeClick(c);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* 구 선택 (검색 중이 아닐 때) */}
      {!isSearching && (
        <section className="home-section">
          <h2 className="home-section__label">구 선택</h2>
          <div className="chip-row chip-row--wrap">
            {districts.map((d) => (
              <FilterChip
                key={d}
                label={d}
                selected={selectedDistrict === d}
                onClick={() => handleDistrictClick(d)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 동 선택 */}
      {!isSearching && selectedDistrict && dongs.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__label">동 선택</h2>
          <div className="chip-row chip-row--wrap">
            <FilterChip
              label="전체"
              selected={selectedDong === "전체"}
              onClick={() => handleDongClick("전체")}
            />
            {dongs.map((d) => (
              <FilterChip
                key={d}
                label={d}
                selected={selectedDong === d}
                onClick={() => handleDongClick(d)}
              />
            ))}
          </div>
        </section>
      )}

      {/* BEST 결과 */}
      {!isSearching && selectedDistrict && (
        <section className="district-result">
          {rankedCafes.length === 0 ? (
            <EmptyState
              title="등록된 카페가 없어요"
              description="다른 구/동을 선택하거나 카페를 제안해 주세요."
            />
          ) : (
            <>
              <p className="district-result__summary">
                {selectedDistrict} {selectedDong !== "전체" ? selectedDong + " " : ""}
                BEST {rankedCafes.length}곳
              </p>
              <div className="cafe-list">
                {rankedCafes.map((cafe, idx) => (
                  <CafeCard
                    key={cafe.id}
                    cafe={cafe}
                    reasons={[`${idx + 1}위 — 카공 종합 점수 기준`]}
                    highlights={getCafeHighlights(cafe)}
                    onClick={(c) => {
                      trackEvent("cafe_card_click", { cafeId: c.id, cafeDistrict: c.district, rank: idx + 1 });
                      onCafeClick(c);
                    }}
                  />
                ))}
              </div>
              <p className="district-result__criteria">
                * 카공 적합도, 조용함, 콘센트, 체류 편의, 커피/디저트를 종합 선정했어요
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
