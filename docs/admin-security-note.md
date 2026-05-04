# 관리자 화면 보안 메모

## 현재 구현 방식

- `?mode=admin` URL 파라미터로 관리자 모드 진입
- `VITE_ADMIN_PASSWORD` 환경 변수와 비교해 비밀번호 검증
- 인증 성공 시 `sessionStorage`에 `kagong_admin_session=ok` 저장 (탭/브라우저 닫으면 자동 만료)

## 알려진 보안 한계

**`VITE_ADMIN_PASSWORD`는 Vite 클라이언트 번들에 포함됩니다.**

- `vite build` 결과물(JS 번들)을 분석하면 비밀번호 원문이 노출될 수 있습니다.
- 따라서 이 방식은 "알려지면 치명적인" 시스템 자산(결제, PII, 서버 키)을 보호하는 수단이 될 수 없습니다.

### 현재 구현이 감수할 수 있는 이유

- 관리자 화면이 읽는 데이터는 `localStorage`에 저장된 사용자 제안 목록입니다 (이미 해당 기기에 존재).
- Supabase `service_role` 키, 사용자 개인정보, 결제 정보를 다루지 않습니다.
- 번들 분석 공격자가 이 관리자 화면에 들어와도 얻을 수 있는 정보의 범위가 제한적입니다.
- 본 앱은 앱인토스 Mini App으로 일반 URL 직접 접근이 제한적입니다.

## Phase B 전환 시 반드시 교체해야 할 사항

관리자 화면이 Supabase `raw_cafe_candidates` 또는 민감한 사용자 데이터를 다루게 되면 아래 중 하나로 교체하세요.

1. **Supabase Auth + `admin` role RLS**: 관리자 계정으로 로그인, RLS가 데이터 접근을 제어
2. **별도 관리자 웹앱**: 클라이언트 번들과 완전히 분리, `service_role` 키는 서버에서만 사용
3. **Vercel Functions + 서버 사이드 세션**: 비밀번호 검증을 서버에서 수행, 번들에 미포함

## 지금 당장 해야 할 것

- `.env.local`에 `VITE_ADMIN_PASSWORD`를 강력한 무작위 문자열로 설정
- Vercel 프로젝트 설정 → Environment Variables에도 동일하게 추가
- 비밀번호를 메신저나 코드 주석에 노출하지 않도록 주의
