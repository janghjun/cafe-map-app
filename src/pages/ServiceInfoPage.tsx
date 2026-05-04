import { FaqItem } from "../components/FaqItem";
import "../styles/pages.css";

type Props = {
  onBack: () => void;
  onSuggestClick?: () => void;
};

export function ServiceInfoPage({ onBack, onSuggestClick }: Props) {
  return (
    <div className="page detail-page">
      <div className="page-top-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 뒤로
        </button>
      </div>

      <section className="detail-section">
        <h1 className="detail-name">서비스 안내</h1>
        <p className="detail-address">
          카공 어디가? 인천편이 데이터를 다루는 방식을 안내해 드려요.
        </p>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">위치 정보</h2>
        <div className="info-body">
          <p>위치는 가까운 카페를 추천하는 데만 사용돼요.</p>
          <p>좌표는 서버에 전송되거나 앱 밖에 저장되지 않아요.</p>
          <p>위치 권한을 거부해도 인천 중심 기준으로 추천받을 수 있어요.</p>
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">기기 저장 데이터</h2>
        <div className="info-body">
          <p>즐겨찾기, 최근 본 카페, 이용 기록은 이 기기의 저장소에만 보관돼요.</p>
          <p>앱을 삭제하거나 브라우저 데이터를 지우면 함께 삭제돼요.</p>
          <p>즐겨찾기와 최근 본 카페는 앱 안에서 직접 삭제할 수 있어요.</p>
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">카페 제안</h2>
        <div className="info-body">
          <p>제안해 주신 카페는 즉시 공개되지 않아요.</p>
          <p>운영팀이 확인하고 검수를 통과하면 앱에 반영돼요.</p>
          <p>제안 내용에 개인정보는 포함하지 않아도 돼요.</p>
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">익명 식별자 및 이벤트 로그</h2>
        <div className="info-body">
          <p>앱 첫 실행 시 기기에서 무작위 익명 ID가 생성돼요. 이름, 연락처 등 개인정보와 연결되지 않아요.</p>
          <p>앱 이용 중 화면 전환, 추천 요청, 즐겨찾기 등 행동 기록이 이 기기에 저장돼요.</p>
          <p>기록에는 위치 좌표, 주소, 전화번호 등 개인을 특정할 수 있는 정보가 포함되지 않아요.</p>
          <p>이벤트 로그는 최대 500건까지 이 기기에만 보관돼요. 현재 외부 서버로 전송되지 않아요.</p>
          <p>브라우저 데이터 또는 앱 저장소를 삭제하면 익명 ID와 이벤트 로그가 함께 삭제돼요.</p>
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">외부 링크</h2>
        <div className="info-body">
          <p>"네이버 지도에서 보기"는 카페 위치 확인을 돕는 보조 기능이에요.</p>
          <p>클릭 시 네이버 지도로 이동하며, 네이버의 이용약관이 적용돼요.</p>
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">카공 적합도 기준</h2>
        <div className="info-body">
          <p>카공 적합도는 외부 리뷰나 평점을 그대로 복제한 것이 아니에요.</p>
          <p>운영팀이 직접 수집한 기준으로 점수를 매겨요.</p>
          <p>실제 운영 상황은 방문 전 직접 확인해 주세요.</p>
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__label">자주 묻는 질문</h2>
        <div className="faq-list">
          <FaqItem question="카페 정보는 얼마나 정확한가요?">
            <p>운영팀이 직접 수집하고 확인한 정보를 바탕으로 해요.</p>
            <p>카페 상세 화면에서 확인 날짜와 검증 상태를 볼 수 있어요.</p>
            <p>운영 시간이나 환경은 방문 전 직접 확인하는 걸 권장해요.</p>
          </FaqItem>

          <FaqItem question="카페가 없어졌거나 정보가 다르면 어떻게 하나요?">
            <p>카페 상세 화면 하단의 "정보가 다른가요? 수정 제안하기"를 눌러 알려주세요.</p>
            <p>운영팀이 확인 후 정보를 업데이트하거나 목록에서 제외할게요.</p>
            {onSuggestClick && (
              <button type="button" className="btn-text" onClick={onSuggestClick}>
                카페 정보 제안하러 가기 →
              </button>
            )}
          </FaqItem>

          <FaqItem question="추천 기준은 무엇인가요?">
            <p>조용함, 콘센트, 와이파이, 체류 편의, 커피/디저트 등 카공에 필요한 항목을 운영팀 기준으로 점수화했어요.</p>
            <p>거리, 인원, 분위기 조건도 반영해서 내 상황에 맞는 순서로 보여줘요.</p>
            <p>외부 별점이나 리뷰 수는 반영하지 않아요.</p>
          </FaqItem>

          <FaqItem question="네이버 지도 링크는 왜 사용하나요?">
            <p>직접 지도를 제공하지 않아 네이버 지도에서 위치와 경로를 확인할 수 있게 연결해요.</p>
            <p>링크를 클릭하면 네이버 지도 앱 또는 웹으로 이동하며, 네이버의 이용약관이 적용돼요.</p>
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
            <p>카공 관점에서 운영팀이 직접 수집한 기준만 사용해서 더 신뢰할 수 있는 정보를 제공하려고 해요.</p>
          </FaqItem>
        </div>
      </section>

      <div className="page-footer-link">
        {/* TODO: 앱인토스 심사 요건에 따라 정식 개인정보처리방침 URL 추가 필요 */}
        {/* TODO: 운영자 문의 이메일/채널 확정 후 아래에 추가 */}
        <p className="detail-footnote">
          이 안내는 법적 효력이 있는 개인정보처리방침이 아니에요.
          서비스 이용 중 문의사항이 있으면 카페 제안하기를 통해 알려주세요.
          앱인토스 심사 전 정식 개인정보처리방침으로 교체될 예정이에요.
        </p>
      </div>
    </div>
  );
}
