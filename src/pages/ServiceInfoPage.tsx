import "../styles/pages.css";

type Props = {
  onBack: () => void;
};

export function ServiceInfoPage({ onBack }: Props) {
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

      <div className="page-footer-link">
        {/* TODO: 앱인토스 심사 요건에 따라 정식 개인정보처리방침 URL 추가 필요 */}
        <p className="detail-footnote">
          이 안내는 법적 효력이 있는 개인정보처리방침이 아니에요.
          앱인토스 심사 요건 확인 후 별도 정책 페이지로 교체될 수 있어요.
        </p>
      </div>
    </div>
  );
}
