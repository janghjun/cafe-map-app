import { FaqItem } from "../components/FaqItem";
import { MascotImage } from "../components/MascotImage";
import "../styles/pages.css";

type Props = {
  onBack: () => void;
  onSuggestClick?: () => void;
};

type InfoCardProps = {
  badge: string;
  title: string;
  children: React.ReactNode;
};

function InfoCard({ badge, title, children }: InfoCardProps) {
  return (
    <div className="si-card">
      <div className="si-card__header">
        <span className="si-badge">{badge}</span>
        <h2 className="si-card__title">{title}</h2>
      </div>
      <div className="si-card__body">{children}</div>
    </div>
  );
}

const SCORE_ITEMS = [
  { label: "조용함", desc: "집중 환경" },
  { label: "콘센트", desc: "충전 편의성" },
  { label: "와이파이", desc: "연결 안정성" },
  { label: "체류", desc: "장시간 부담도" },
  { label: "공간", desc: "좌석 간격·넓이" },
  { label: "1인", desc: "혼자 적합도" },
  { label: "그룹", desc: "다인 적합도" },
  { label: "음료", desc: "커피·디저트" },
];

const PRINCIPLES = [
  { label: "직접 수집", desc: "운영팀 직접 검증" },
  { label: "카공 특화", desc: "공부 환경 기준" },
  { label: "기기 보관", desc: "개인정보 외부 미전송" },
];

export function ServiceInfoPage({ onBack, onSuggestClick }: Props) {
  return (
    <div className="page si-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
      </div>

      {/* 히어로 */}
      <section className="si-hero">
        <div className="si-hero__text">
          <p className="si-hero__eyebrow">카공 어디가? 인천편</p>
          <h1 className="si-hero__title">서비스 안내</h1>
          <p className="si-hero__desc">
            카공에 딱 맞는 카페만<br />직접 골라 안내해요.
          </p>
        </div>
        <MascotImage state="checking" size="md" decorative />
      </section>

      {/* 3원칙 */}
      <div className="si-principles">
        {PRINCIPLES.map((p) => (
          <div key={p.label} className="si-principle">
            <span className="si-principle__check">✓</span>
            <strong className="si-principle__label">{p.label}</strong>
            <span className="si-principle__desc">{p.desc}</span>
          </div>
        ))}
      </div>

      {/* 정보 카드 */}
      <div className="si-cards">
        <InfoCard badge="위치" title="위치 정보">
          <p>가까운 카페를 추천하는 데만 사용돼요.</p>
          <p>좌표는 서버에 전송되거나 앱 밖에 저장되지 않아요.</p>
          <p>위치 권한을 거부해도 인천 중심 기준으로 추천받을 수 있어요.</p>
        </InfoCard>

        <InfoCard badge="저장" title="기기 저장 데이터">
          <p>즐겨찾기, 최근 본 카페, 이용 기록은 이 기기에만 보관돼요.</p>
          <p>앱 삭제나 브라우저 데이터 초기화 시 함께 삭제돼요.</p>
          <p>앱 안에서 직접 삭제할 수 있어요.</p>
        </InfoCard>

        <InfoCard badge="제안" title="카페 제안">
          <p>제안해 주신 카페는 즉시 공개되지 않아요.</p>
          <p>운영팀이 검수를 통과하면 앱에 반영돼요.</p>
          <p>제안 내용에 개인정보는 포함하지 않아도 돼요.</p>
        </InfoCard>

        <InfoCard badge="로그" title="익명 식별자 및 이벤트 로그">
          <p>앱 첫 실행 시 기기에서 무작위 익명 ID가 생성돼요. 이름·연락처 등 개인정보와 연결되지 않아요.</p>
          <p>화면 전환, 추천 요청 등 이용 기록이 이 기기에 저장돼요.</p>
          <p>이벤트 로그는 최대 500건까지 이 기기에만 보관되며, 현재 외부 서버로 전송되지 않아요.</p>
        </InfoCard>

        <InfoCard badge="링크" title="외부 링크">
          <p>"네이버 지도에서 보기"는 위치 확인을 돕는 보조 기능이에요.</p>
          <p>클릭 시 네이버 지도 앱 또는 웹으로 이동하며, 네이버의 이용약관이 적용돼요.</p>
        </InfoCard>

        <InfoCard badge="기준" title="카공 적합도 기준">
          <p>외부 리뷰나 별점을 복제하지 않아요. 운영팀이 직접 수집한 기준으로 점수를 매겨요.</p>
          <div className="si-score-grid">
            {SCORE_ITEMS.map((item) => (
              <div key={item.label} className="si-score-item">
                <strong className="si-score-item__label">{item.label}</strong>
                <span className="si-score-item__desc">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="si-note">실제 운영 상황은 방문 전 직접 확인해 주세요.</p>
        </InfoCard>
      </div>

      {/* FAQ */}
      <div className="si-faq">
        <h2 className="si-faq__title">자주 묻는 질문</h2>
        <div className="faq-list">
          <FaqItem question="카페 정보는 얼마나 정확한가요?">
            <p>운영팀이 직접 수집하고 확인한 정보를 바탕으로 해요.</p>
            <p>카페 상세에서 확인 날짜와 검증 상태를 볼 수 있어요.</p>
            <p>운영 시간이나 환경은 방문 전 직접 확인하는 걸 권장해요.</p>
          </FaqItem>

          <FaqItem question="카페가 없어졌거나 정보가 다르면 어떻게 하나요?">
            <p>카페 상세 화면 하단의 "수정 제안하기"를 눌러 알려주세요.</p>
            <p>운영팀이 확인 후 정보를 업데이트하거나 목록에서 제외할게요.</p>
            {onSuggestClick && (
              <button type="button" className="btn-text" onClick={onSuggestClick}>
                카페 정보 제안하러 가기 →
              </button>
            )}
          </FaqItem>

          <FaqItem question="추천 기준은 무엇인가요?">
            <p>조용함, 콘센트, 와이파이, 체류 편의, 커피/디저트 등을 운영팀 기준으로 점수화했어요.</p>
            <p>거리, 인원, 분위기 조건도 반영해 내 상황에 맞는 순서로 보여줘요.</p>
            <p>외부 별점이나 리뷰 수는 반영하지 않아요.</p>
          </FaqItem>

          <FaqItem question="네이버 지도 링크는 왜 사용하나요?">
            <p>직접 지도를 제공하지 않아 네이버 지도에서 위치와 경로를 확인할 수 있게 연결해요.</p>
            <p>링크 클릭 시 네이버의 이용약관이 적용돼요.</p>
          </FaqItem>

          <FaqItem question="제가 아는 카페를 추가할 수 있나요?">
            <p>네, "카페 제안하기"로 알려주시면 운영팀이 직접 확인한 뒤 앱에 반영할게요.</p>
            <p>즉시 공개되지 않고 검수 후에만 등록돼요.</p>
            {onSuggestClick && (
              <button type="button" className="btn-text" onClick={onSuggestClick}>
                카페 제안하러 가기 →
              </button>
            )}
          </FaqItem>

          <FaqItem question="리뷰나 평점은 왜 그대로 보여주지 않나요?">
            <p>외부 리뷰나 평점을 그대로 복제하면 저작권 문제가 생길 수 있어요.</p>
            <p>카공 관점에서 운영팀이 직접 수집한 기준만 사용해 더 신뢰할 수 있는 정보를 제공해요.</p>
          </FaqItem>
        </div>
      </div>

      <div className="page-footer-link">
        <p className="detail-footnote">
          이 안내는 법적 효력이 있는 개인정보처리방침이 아니에요.
          문의사항은 카페 제안하기를 통해 알려주세요.
        </p>
      </div>
    </div>
  );
}
