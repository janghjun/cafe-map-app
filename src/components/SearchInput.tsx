import "../styles/components.css";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "카페명이나 동네로 찾아보세요",
}: Props) {
  return (
    <div className="search-input-wrap">
      <input
        type="search"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="카페 검색"
      />
      {value && (
        <button
          type="button"
          className="search-input-clear"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
        >
          ×
        </button>
      )}
    </div>
  );
}
