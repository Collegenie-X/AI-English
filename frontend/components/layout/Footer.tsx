import Link from 'next/link'
import { Globe } from 'lucide-react'

// ── SNS 아이콘 ─────────────────────────────────────────────
function KakaoTalkIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="18" fill="#FFE812" />
      <path
        d="M18 8C12.477 8 8 11.582 8 16c0 2.77 1.663 5.215 4.2 6.715l-1.07 3.984a.3.3 0 00.455.327L16.12 24.4A13.6 13.6 0 0018 24.5c5.523 0 10-3.582 10-8S23.523 8 18 8z"
        fill="#3C1E1E"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="18" fill="url(#ig-grad)" />
      <rect x="10" y="10" width="16" height="16" rx="4.5" stroke="white" strokeWidth="1.6" fill="none" />
      <circle cx="18" cy="18" r="4" stroke="white" strokeWidth="1.6" fill="none" />
      <circle cx="23" cy="13" r="1" fill="white" />
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="100%" r="120%">
          <stop offset="0%" stopColor="#ffd879" />
          <stop offset="30%" stopColor="#f78241" />
          <stop offset="60%" stopColor="#e4405f" />
          <stop offset="100%" stopColor="#833ab4" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// ── 링크 데이터 ──────────────────────────────────────────────
const LEGAL_LINKS = [
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '이용약관',         href: '/terms'   },
  { label: '법적고지',         href: '/legal'   },
]

const SNS_LINKS = [
  { label: 'KakaoTalk 채널',  href: 'https://pf.kakao.com', Icon: KakaoTalkIcon },
  { label: 'Instagram',        href: 'https://instagram.com', Icon: InstagramIcon  },
]

// ── 회사 정보 ────────────────────────────────────────────────
const COMPANY = {
  name:       'LingoBaby',
  corp:       '(주)링고베이비',
  ceo:        '대표',
  copyright:  `© ${new Date().getFullYear()} LingoBaby. All Rights Reserved.`,
  address:    '서울특별시 성동구 뚝섬로1나길 5',
  tel:        '1833-4405',
  bizNo:      '000-00-00000',
  mallNo:     '2024-서울성동-00000',
}

// ── 컴포넌트 ─────────────────────────────────────────────────
export function Footer() {
  return (
    <footer
      aria-label="사이트 푸터"
      className="w-full border-t border-gray-200 bg-white text-xs text-gray-500"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* 상단 행: SNS + 언어/국가 */}
        <div className="flex items-center justify-between">
          {/* SNS 아이콘 */}
          <div className="flex items-center gap-3">
            {SNS_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="opacity-90 hover:opacity-100 transition-opacity"
              >
                <Icon />
              </a>
            ))}
          </div>

          {/* 언어/국가 선택 */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="언어 및 국가 선택"
          >
            <Globe size={14} strokeWidth={1.8} />
            <span>대한민국</span>
            <span className="text-gray-300 mx-0.5">|</span>
            <span>한국어</span>
          </button>
        </div>

        {/* 중단 행: 법적 링크 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {LEGAL_LINKS.map(({ label, href }, i) => (
            <span key={label} className="flex items-center gap-4">
              {i > 0 && <span className="text-gray-300 -mx-2">|</span>}
              <Link
                href={href}
                className="font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                {label}
              </Link>
            </span>
          ))}
        </div>

        {/* 하단 행: 저작권 + 사업자 정보 */}
        <div className="space-y-1 text-gray-400 leading-relaxed">
          <p>
            {COMPANY.copyright}
            &nbsp;&nbsp;
            <span>{COMPANY.corp} {COMPANY.ceo}</span>
          </p>
          <p>
            주소 {COMPANY.address}&nbsp;&nbsp;대표전화 {COMPANY.tel}
          </p>
          <p>
            통신판매 신고번호 {COMPANY.mallNo}&nbsp;&nbsp;
            사업자 등록번호 {COMPANY.bizNo}
          </p>
        </div>

      </div>
    </footer>
  )
}
