import { useState, useMemo } from "react";
import type { Cafe } from "../types/cafe";
import { CafeCard } from "../components/CafeCard";
import { EmptyState } from "../components/EmptyState";
import { getCafesSync } from "../services/cafeService";
import { getCafeHighlights } from "../utils/cafeHighlights";
import { trackEvent } from "../services/logService";
import {
  getCourses,
  createCourse,
  deleteCourse,
  addCafeToCourse,
  removeCafeFromCourse,
  type StudyCourse,
} from "../services/courseService";
import "../styles/pages.css";

type Props = {
  favoriteIds: string[];
  onCafeClick: (cafe: Cafe, distanceLabel?: string) => void;
  onFavoriteToggle: (cafe: Cafe) => void;
  onBack: () => void;
};

type Tab = "favorites" | "courses";

function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, ".");
}

export function FavoritesPage({ favoriteIds, onCafeClick, onFavoriteToggle, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("favorites");
  const [courses, setCourses] = useState<StudyCourse[]>(() => getCourses());
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const allCafes = getCafesSync();
  const cafeLookup = useMemo(() => new Map(allCafes.map((c) => [c.id, c])), [allCafes]);
  const favoriteCafes = useMemo(
    () => allCafes.filter((c) => favoriteIds.includes(c.id)),
    [allCafes, favoriteIds]
  );

  function refreshCourses() {
    setCourses(getCourses());
  }

  function handleCreateCourse() {
    if (!newCourseName.trim()) return;
    const course = createCourse(newCourseName);
    refreshCourses();
    setNewCourseName("");
    setIsCreating(false);
    trackEvent("course_created", { source: course.id });
  }

  function handleDeleteCourse(courseId: string) {
    deleteCourse(courseId);
    refreshCourses();
    if (activeCourseId === courseId) setActiveCourseId(null);
    trackEvent("course_deleted", { source: courseId });
  }

  function handleAddToCourse(courseId: string, cafeId: string) {
    addCafeToCourse(courseId, cafeId);
    refreshCourses();
    trackEvent("course_cafe_added", { source: courseId });
  }

  function handleRemoveFromCourse(courseId: string, cafeId: string) {
    removeCafeFromCourse(courseId, cafeId);
    refreshCourses();
    trackEvent("course_cafe_removed", { source: courseId });
  }

  function handleOpenCourse(courseId: string) {
    setActiveCourseId(courseId);
    trackEvent("course_viewed", { source: courseId });
  }

  // ── 코스 상세 뷰 ────────────────────────────────────────────
  const activeCourse = activeCourseId ? courses.find((c) => c.id === activeCourseId) : null;

  if (activeTab === "courses" && activeCourseId) {
    if (!activeCourse) {
      setActiveCourseId(null);
      return null;
    }

    const courseCafes = activeCourse.cafeIds
      .map((id) => cafeLookup.get(id))
      .filter((c): c is Cafe => c !== undefined);

    const addableCafes = favoriteCafes.filter(
      (c) => !activeCourse.cafeIds.includes(c.id)
    );

    return (
      <div className="page favorites-page">
        <div className="page-top-bar">
          <button type="button" className="btn-back" onClick={() => setActiveCourseId(null)}>
            ← 뒤로
          </button>
        </div>

        <header className="district-header">
          <h1 className="district-title">{activeCourse.name}</h1>
          <p className="district-subtitle">
            {courseCafes.length > 0 ? `카페 ${courseCafes.length}곳` : "아직 추가된 카페가 없어요"}
          </p>
        </header>

        {courseCafes.length === 0 ? (
          <div className="course-empty">
            <p>아래 즐겨찾기에서 카페를 추가해 코스를 채워보세요.</p>
          </div>
        ) : (
          <div className="cafe-list">
            {courseCafes.map((cafe, idx) => (
              <div key={cafe.id} className="course-cafe-item">
                <CafeCard
                  cafe={cafe}
                  onClick={onCafeClick}
                  isFavorite={favoriteIds.includes(cafe.id)}
                  onFavoriteClick={onFavoriteToggle}
                />
                <div className="course-cafe-item__footer">
                  <span className="course-cafe-item__num">코스 {idx + 1}번째</span>
                  <button
                    type="button"
                    className="course-cafe-remove-btn"
                    onClick={() => handleRemoveFromCourse(activeCourse.id, cafe.id)}
                  >
                    제거
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {addableCafes.length > 0 && (
          <section className="course-add-section">
            <h2 className="detail-section__label">즐겨찾기에서 추가</h2>
            <div className="course-add-list">
              {addableCafes.map((cafe) => (
                <div key={cafe.id} className="course-add-item">
                  <div className="course-add-item__info">
                    <span className="course-add-item__name">{cafe.name}</span>
                    <span className="course-add-item__location">
                      {cafe.district} {cafe.dong}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="course-add-btn"
                    onClick={() => handleAddToCourse(activeCourse.id, cafe.id)}
                  >
                    + 추가
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {favoriteCafes.length === 0 && (
          <div className="course-add-hint">
            <p>즐겨찾기에 카페를 저장하면 코스에 추가할 수 있어요.</p>
          </div>
        )}
      </div>
    );
  }

  // ── 메인 뷰 (탭) ────────────────────────────────────────────
  return (
    <div className="page favorites-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
      </div>

      <header className="district-header">
        <h1 className="district-title">나의 카공 공간</h1>
        <p className="district-subtitle">
          {activeTab === "favorites"
            ? "다시 가고 싶은 카공 카페를 모아봤어요."
            : "여러 카페를 묶어 나만의 카공 코스를 만들어요."}
        </p>
      </header>

      {/* 탭 바 */}
      <div className="theme-tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "favorites"}
          className={`theme-tab${activeTab === "favorites" ? " theme-tab--active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          ★ 즐겨찾기{favoriteIds.length > 0 ? ` (${favoriteIds.length})` : ""}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "courses"}
          className={`theme-tab${activeTab === "courses" ? " theme-tab--active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          📍 카공 코스{courses.length > 0 ? ` (${courses.length})` : ""}
        </button>
      </div>

      {/* ── 즐겨찾기 탭 ── */}
      {activeTab === "favorites" && (
        favoriteCafes.length === 0 ? (
          <EmptyState
            title="아직 저장한 카공 스팟이 없어요"
            description="카페 상세에서 ☆를 누르면 여기에 모아둘 수 있어요."
            actionLabel="카공 카페 찾아보기"
            onAction={onBack}
          />
        ) : (
          <div className="cafe-list">
            {favoriteCafes.map((cafe) => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                highlights={getCafeHighlights(cafe)}
                onClick={onCafeClick}
                onFavoriteClick={onFavoriteToggle}
                isFavorite
              />
            ))}
          </div>
        )
      )}

      {/* ── 카공 코스 탭 ── */}
      {activeTab === "courses" && (
        <div className="course-list">
          {isCreating ? (
            <div className="course-new-form">
              <input
                type="text"
                className="course-new-input"
                placeholder="코스 이름 (예: 부평 카공 루트)"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCourse();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewCourseName("");
                  }
                }}
                maxLength={30}
                autoFocus
              />
              <div className="course-new-form__actions">
                <button
                  type="button"
                  className="course-new-submit"
                  onClick={handleCreateCourse}
                  disabled={!newCourseName.trim()}
                >
                  저장
                </button>
                <button
                  type="button"
                  className="course-new-cancel"
                  onClick={() => {
                    setIsCreating(false);
                    setNewCourseName("");
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="course-create-btn"
              onClick={() => setIsCreating(true)}
            >
              + 새 코스 만들기
            </button>
          )}

          {courses.length === 0 && !isCreating && (
            <EmptyState
              title="아직 만든 코스가 없어요"
              description="여러 카페를 묶어 나만의 카공 루트를 만들어보세요."
            />
          )}

          {courses.map((course) => (
            <div
              key={course.id}
              className="course-item"
              role="button"
              tabIndex={0}
              onClick={() => handleOpenCourse(course.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleOpenCourse(course.id);
              }}
            >
              <div className="course-item__info">
                <span className="course-item__name">{course.name}</span>
                <span className="course-item__meta">
                  {course.cafeIds.length > 0
                    ? `카페 ${course.cafeIds.length}곳`
                    : "카페 없음"}{" "}
                  · {formatDate(course.createdAt)}
                </span>
              </div>
              <div className="course-item__actions">
                <button
                  type="button"
                  className="course-item__delete"
                  aria-label={`${course.name} 코스 삭제`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id);
                  }}
                >
                  🗑
                </button>
                <span className="course-item__arrow" aria-hidden="true">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
