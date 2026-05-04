import { useState } from "react";
import "../../styles/admin.css";

type Props = {
  onLogin: () => void;
};

export function AdminLoginPage({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const adminPass = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

  function handleSubmit() {
    if (!adminPass || !password) return;
    if (password === adminPass) {
      sessionStorage.setItem("kagong_admin_session", "ok");
      onLogin();
    } else {
      setError(true);
      setPassword("");
    }
  }

  if (!adminPass) {
    return (
      <div className="admin-login-page admin-login-page--unconfigured">
        <p className="admin-login-unconfigured">관리자 접근이 설정되지 않았어요.</p>
        <p className="admin-login-hint">
          VITE_ADMIN_PASSWORD 환경 변수를 .env.local에 추가해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <h1 className="admin-login-title">관리자 확인</h1>
        <p className="admin-login-desc">운영자 비밀번호를 입력해 주세요.</p>
        <input
          type="password"
          className={`admin-login-input${error ? " admin-login-input--error" : ""}`}
          placeholder="비밀번호"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          autoFocus
        />
        {error && <p className="admin-login-error">비밀번호가 올바르지 않아요.</p>}
        <button
          type="button"
          className="admin-login-btn"
          onClick={handleSubmit}
          disabled={!password}
        >
          확인
        </button>
        <p className="admin-login-warning">
          ⚠️ 이 화면은 운영자 전용입니다.
        </p>
      </div>
    </div>
  );
}
