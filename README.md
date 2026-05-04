# C-Quant

**EU ETS · K-ETS · China ETS 탄소배출권 매수 / 보유 / 매도 의사결정 데스크.**
**A decision-support desk for buying, holding, or reducing EU ETS, K-ETS, and China ETS carbon allowances.**

C-Quant은 기관 분석가가 **"오늘 탄소배출권을 살까, 들고 갈까, 줄일까?"** 라는 한 가지 질문에 답하기 위한 데스크톱 도구입니다. 공식 경매 결과·거래소 공시·정책 공지를 1차 앵커로 읽고, 그 위에 리서치 기반 드라이버 매트릭스, 다중-드라이버 촉매 조합, 실시간 트리거 감지, 백테스트로 보정된 multiplier를 쌓아 **buy / hold / reduce** 자세를 산출합니다.

C-Quant is a desktop tool that helps an institutional analyst answer one question — **"Should I buy, hold, or reduce carbon allowances right now?"** — by reading official auctions, exchange snapshots, and policy bulletins as primary anchors, layering a research-backed driver matrix, multi-driver catalyst combinations, real-time trigger detection, and backtest-derived multipliers on top, and surfacing a single **buy / hold / reduce** posture with the evidence trail intact.

거래를 체결하지도, 자산을 수탁하지도, 결제를 중개하지도 않습니다. 리서치·모니터링·의사결정 보조 소프트웨어입니다.
It does not execute trades, custody assets, or intermediate settlement. It is research, monitoring, and decision-support software.

[![CI](https://github.com/hyunjin-kor/C-Quant/actions/workflows/ci.yml/badge.svg)](https://github.com/hyunjin-kor/C-Quant/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 24+](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](.nvmrc)

---

## 무엇을 결정하게 도와주는가 / What decision it supports

| 사용자 질문 · User question | C-Quant이 답하는 방식 · How C-Quant answers |
| --- | --- |
| 지금 EUA 매수해도 되나? · Buy EUA now? | 공식 경매 결과 + 드라이버 가중 점수 + 활성 촉매 패턴 → **posture (buy/hold/reduce)** + 신뢰도 |
| K-ETS 보유 포지션 줄여야 하나? · Reduce K-ETS exposure? | KRX 종가 + 컴플라이언스 윈도우 근접도 + 정책 공지 신선도 |
| 중국 시장 변곡점이 다가오는가? · Chinese ETS turning point? | MEE 공지 + 업종 확대 시나리오 활성도 + 일일 거래대금 |
| 어떤 신호를 우선 봐야 하는가? · Which signal to weight today? | 현재 활성화된 다중-드라이버 시나리오 자동 감지 + 백테스트 hit-rate |
| 모델 출력을 얼마나 신뢰할 수 있나? · How much can I trust the output? | 모든 multiplier에 calibration 출처 표시: heuristic / backtest / calibrated |

---

## 의사결정 신호 스택 / The signal stack

C-Quant이 buy / hold / reduce를 산출하는 8개 레이어. 각 레이어는 명시적인 1차 출처와 신선도 표시를 동반합니다.

C-Quant derives buy / hold / reduce by stacking 8 layers. Each layer carries its primary source and a freshness label.

### Layer 1 — Official anchor (공식 앵커)
- **EU**: EEX EU ETS 1차 경매 워크북 + 경매 페이지 (공식 웹 플로우)
- **K-ETS**: KRX ETS Information Platform + KRX Open API 샘플 (`ets_bydd_trd`)
- **China**: 상하이 환경에너지거래소 일일 개황 + MEE 탄소시장 공시 피드
- 각 카드에 `fresh / watch / stale` 신선도 뱃지

### Layer 2 — Driver matrix (드라이버 매트릭스)
시장별 6개 패밀리, 총 ~47개 드라이버 (검증된 학술·정책 문헌으로 가중치 도출). 각 드라이버는 `weight × direction × importance × note + sources[]` 구조.

| Family · 패밀리 | What lives here · 들어가는 변수 |
| --- | --- |
| Policy supply · 정책 공급 | MSR / TNAC, cap path, allocation share, 4차 기본계획, ETS2, CBAM, K-ETS 페널티 multiplier |
| Power complex · 전력 복합 | 도매 전기가격, clean spark spread, 풍력·태양광 발전 비중, 중국 발전부문 배출 |
| Fuel switching · 연료 전환 | TTF gas, Rotterdam coal, Brent, Qinhuangdao coal, Asian LNG |
| Macro & financial · 거시·금융 | 산업생산, 신용 스프레드, EUR/USD, USD/KRW, USD/CNY, 주가지수 drawdown, ECB·Fed 정책 충격 |
| Weather & seasonality · 날씨·계절성 | 기온 anomaly, 난방 수요, 강수, 한국 컴플라이언스 윈도우, 중국 Q4 집중도 |
| Microstructure · 미시구조 | 경매 커버율, open interest, 거래량, 펀드 포지셔닝, KOC/KAU spread, 파일럿 spillover |

### Layer 3 — Catalyst combinations (다중-드라이버 촉매 조합)
**21개 시나리오 — 각 시나리오는 ≥2개 드라이버 조합** (`src/data/catalystScenarios.ts`).

대표적인 조합:
- **EU 한파 스택**: 기온 anomaly + TTF 가스 spike + 풍력 저하 → 석탄→가스 dispatch flip → EUA 수요 비선형 증가
- **EU MSR + Fit-for-55 스택**: MSR 경매 감축 공지 + Fit-for-55 reaffirmation → 구조적 forward scarcity
- **EU 매파적 ECB + 펀드 디레버리지**: ECB 정책 surprise + ESMA 펀드 net-long 감소 + 주식 drawdown → financialisation 매도 압력
- **EU CBAM 확장 + USD 강세**: CBAM 적용 sector 확대 + EUR/USD < 1.05 → coal-gas substitution 압박
- **EU ETS2 출범 + 가격안정 메커니즘**: 2027년 ETS2 출범 + €45 (2020가격) trigger → 초기 2년 regime
- **K-ETS 컴플라이언스 + KRW 약세 + 한파**: Q1 surrender + USD/KRW > 1,400 + 겨울 LNG burn → 수입연료 비용 + 컴플라이언스 압력
- **K-ETS Phase 4 경매·금융기관 캡 완화**: 2026년 power 경매 15% + 2025-02 금융기관 접근 확대 → regime shift
- **K-ETS 페널티 multiplier 진입**: KAU spot이 60일 평균의 2.5x 접근 + surrender 4주 이내 → soft ceiling
- **China Q4 컴플라이언스 + CCER 디스카운트**: Q4 집중 윈도우 (2024년 79%) + CCER-CEA spread > 15% 디스카운트
- **China 석탄 충격 + 발전부문 배출 release**: Qinhuangdao coal +20%/60일 + Carbon Monitor 배출 YoY > +5%
- **China 파일럿 → 국가 cascade**: 베이징/충칭 파일럿 5일 |%| > 10% + Q4 윈도우 → spillover

각 시나리오: `expectedDirection`, `interactionEffect (amplify / offset / regime-shift)`, `playbook`, `historicalAnchor`, 1차 출처 ≥1개.

### Layer 4 — Active patterns 자동 감지 (실시간)
라이브 카드 데이터에서 4개 신호를 임계치 기반 자동 평가 (`src/lib/catalystTriggerDetector.ts`):
- **Freshness**: 공식 카드 나이 > 24h
- **Price-jump**: 5일간 |%변화| ≥ 5%
- **Volume-jump**: 최근 거래량이 직전 5바 평균의 ≥2배
- **Proxy-divergence**: 공식 종가 vs 1차 listed proxy |gap| ≥ 4%

검증 가능한 컴포넌트 절반 이상이 동시 발화하면 시나리오가 **`active`**로 표시되고 Drivers 뷰 최상단 "지금 활성 패턴" 패널에 카드로 떠오릅니다.

### Layer 5 — Empirical calibration (event-study 백테스트)
25개 인용 가능한 historical event (2018-2025) — MSR 공지, Fit-for-55 발표, ETS revision trilogue, 2021-2022 에너지위기, COVID risk-off, K-ETS 4차 기본계획, MEE 업종 확대 공지, **CCER restart 2024-01-22**, **K-ETS 금융기관 접근 확대 2025-02-07**, **CBAM 전환기 시작 2023-10-01** 등 — 을 EU/K/CN ETS 월별 가격 anchor에 대해 event-study로 평가해 시나리오별 `multiplier`, `meanAbsReturn`, `hitRate` 산출.

| Calibration status | 의미 |
| --- | --- |
| `heuristic` | 임시 상수 (interactionEffect별 1.25 / 1.10 / 0.7) |
| `backtest` | 이벤트 ≥2개로 walk-forward 평가 완료 — multiplier가 데이터 기반 |
| `calibrated` | 백테스트 + 모델 오너 검토 사인오프 (현재 0개, governance 정의됨) |

매 push/PR마다 `npm run calibration:check`이 90일 이내 갱신을 강제.

### Layer 6 — Listed proxy gap (상장 프록시 괴리)
ICE EUA December, KRBN, KEUA, CO2.L, KCCA — Yahoo 공개 차트로 수집해 공식 앵커와 비교. 괴리가 1년 추세 90백분위를 2세션 연속 넘으면 정보 누설 신호로 표시.

### Layer 7 — Materials & abatement atlas (장기 수급 변화)
10개 항목 — 아민 PCC, MOF, DAC, 그린수소, 수소환원철, 저클링커 시멘트, 바이오차, BECCS, 재생전력 LCOE — IPCC AR6 / IEA / IRENA / GCCA / ICVCM / Verra 1차 보고서 인용. 비용 범위·readiness가 바뀌면 장기 배출권 수요 곡선이 흔들리는 효과를 모니터.

### Layer 8 — Public-data feeds (확장 가능한 외부 데이터)
- **FRED** (St. Louis Fed) — 무료 API key gating, `fetchSeries()` 실제 호출
- **ECB SDW** — 키 불필요, CSV/JSON 공개
- **ICAP Allowance Price Explorer** — 공개 dashboard 연결
- **World Bank Carbon Pricing Dashboard** — 장기 cross-jurisdiction 비교

Institutional 어댑터 (Refinitiv / Bloomberg / ICE / EEX)는 라이센스 게이트 — 자격증명 미설정 시 `not-configured` 상태만 노출, 절대 가짜 가격 추정하지 않음.

---

## 의사결정 화면 / Decision surfaces

매 세션은 같은 4단계: **공식 앵커 읽기 → 상장 프록시와 비교 → 드라이버·시나리오 점검 → posture 결정**.
Every session walks the same four steps: read the official anchor → compare with the listed proxy → check the drivers and active scenarios → decide the posture.

### Command — "오늘 무엇을 해야 하고, 왜 그런가?"
<p align="center">
  <img src="docs/images/shot-command-light.png" alt="Command surface" width="100%"/>
</p>

상단 시장 스트립(EU/KR/CN) → 중앙에 anchor vs 프록시 차트 → 우측에 의사결정 메모 (posture + 신뢰도 + support/risk 불릿) → 하단에 강한 드라이버 5개와 신선도 칩.

### Drivers — "어떤 신호가 지금 발화하고 있는가?"
<p align="center">
  <img src="docs/images/shot-drivers-light.png" alt="Drivers surface" width="100%"/>
</p>

이 화면이 **C-Quant의 핵심**입니다. 위에서 아래로:
1. **Decision-support boundary** 고지 (이건 calibrated 가격 예측기가 아님)
2. **지금 활성 패턴** — 라이브 데이터에서 임계치를 넘은 시나리오 카드들
3. **Catalyst combinations** — 21개 시나리오, 현재 드라이버 가중치로 정렬된 점수
4. **Materials & abatement atlas** — 장기 수급 변화 포인터
5. **Institutional feeds 상태** — Refinitiv/Bloomberg/ICE/EEX 라이센스 게이트
6. **Calibration provenance** — 시나리오별 multiplier + observations + hit-rate + status
7. **Event timeline** — 25개 historical event
8. **Public-data feeds 상태** — FRED/ECB SDW/ICAP/World Bank
9. **Driver families heatmap** — 시장 비교

### Desk — "이 시장 한 군데를 깊게 보고 싶다"
<p align="center">
  <img src="docs/images/shot-desk-light.png" alt="Desk surface" width="100%"/>
</p>

특정 시장(EU/K/CN) 하나에 집중하면서 anchor vs hedge tape 차트, 범위·상관성 테이블, 시나리오 가중치 슬라이더를 한 화면에. 시장별 brief 작성 시 사용.

### Sources — "이 데이터의 출처는 어디고, 얼마나 신선한가?"
<p align="center">
  <img src="docs/images/shot-sources-light.png" alt="Sources surface" width="100%"/>
</p>

모든 1차 출처의 access method, 신선도, in-app 벤치마크 카탈로그, 입력 커버리지, 신뢰 레지스트리. 컴플라이언스 검토 시 첫 번째로 보는 화면.

➡️ 화면별 자세한 사용법 / Screen-by-screen walkthrough: [docs/USAGE.md](docs/USAGE.md)

---

## What it does NOT do (경계 / boundary)

| 영역 · Area | 상태 · State |
| --- | --- |
| 주문 라우팅·체결 · Order routing / execution | **NO** — 라이센스 브로커 사용 |
| 자산 수탁·결제 · Custody / settlement | **NO** — 라이센스 레지스트리·커스터디언 |
| 개별 매수/매도 권유 · Individualized buy/sell recommendations | **NO** — 운영자 판단 + 컴플라이언스 |
| 1차 공시 대체 · Replacement for primary disclosure | **NO** — 원문 직접 사용 |
| 라이센스 데이터 위조 · Fabricated institutional pricing | **NO** — 미설정 어댑터는 `not-configured` 상태만 노출 |
| 인용 위조 · Fabricated citations | **NO** — DOI / blog / vendor URL 추측 금지 |

관할권별 컴플라이언스 노트:
- [docs/COMPLIANCE.md](docs/COMPLIANCE.md) — 일반 경계와 calibration governance
- [docs/COMPLIANCE-EU.md](docs/COMPLIANCE-EU.md) — MiFID II / MAR / BMR / CSRD
- [docs/COMPLIANCE-KR.md](docs/COMPLIANCE-KR.md) — 자본시장법 / 온실가스 배출권 거래법 / PIPA
- [docs/COMPLIANCE-CN.md](docs/COMPLIANCE-CN.md) — Securities Law / PIPL / Provisional Carbon Trading Regulations
- [docs/MODEL_CARD.md](docs/MODEL_CARD.md) — 모델 카드 (입력·출력·한계·갱신 규칙)

---

## Quick start

> Node 24 (`.nvmrc` 참조) + Windows 10/11 권장. macOS / Linux 빌드는 advisory.
> Requires Node 24 (see `.nvmrc`) and Windows 10/11 as the primary target. macOS / Linux are advisory.

```powershell
nvm use
npm install
npm run dev          # Vite + Electron
```

배포 빌드 / Distribution build:

```powershell
npm run package:portable     # C-Quant-X.Y.Z-portable.exe
npm run package:nsis         # C-Quant-Setup-X.Y.Z.exe (auto-update wired)
```

릴리즈 자산은 [Releases](https://github.com/hyunjin-kor/C-Quant/releases) 페이지에 게시됩니다. SmartScreen 첫 실행 경고는 **추가 정보 → 실행**.

---

## 검증 / Quality gates

```bash
npm run type-check           # tsc --noEmit
npm run lint                 # ESLint flat config
npm test                     # vitest — 23 files, 197 tests
npm run test:node            # node:test — 53 localization tests
npm run build                # type-check + vite build
npm run ci:verify            # syntax check all electron entrypoints + scripts
npm run calibration:check    # 시나리오 calibration 90일 신선도 강제
npm run bundle:check         # 번들 size budget
npm run e2e                  # Playwright Electron smoke
```

CI는 push/PR마다 위 항목 전체를 Windows·macOS·Linux에서 실행. macOS/Linux는 cross-platform 패키징 안정화 전까지 advisory.

---

## 기술 스택 / Tech

- **Electron 41** + **React 19** + **TypeScript 6** + **Vite 8**
- **Vitest 2** (197 unit tests across 23 files) + **Playwright** (E2E smoke) + **node:test** (localization)
- **electron-builder** (portable + NSIS Windows, dmg/zip macOS, AppImage/deb Linux)
- **electron-updater** + Sentry (DSN-gated, opt-in)
- 한글 지원: Pretendard variable font, 한국 숫자 단위(만 / 억 / 조)
- 세 실행 컨텍스트 (main / preload / renderer), 단일 IPC 경계, 모든 영속화는 `<userData>` 아래

전체 모듈 맵 / Full module map: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 프로젝트 메타 / Project meta

| 문서 | 내용 |
| --- | --- |
| [docs/USAGE.md](docs/USAGE.md) | 화면별 사용 가이드 |
| [docs/MODEL_CARD.md](docs/MODEL_CARD.md) | 모델 카드 (입출력·한계·갱신 규칙) |
| [docs/COMPLIANCE.md](docs/COMPLIANCE.md) | 일반 컴플라이언스 + calibration governance |
| [docs/COMPLIANCE-EU.md](docs/COMPLIANCE-EU.md) | EU 관할권 (MiFID II / MAR / BMR / CSRD) |
| [docs/COMPLIANCE-KR.md](docs/COMPLIANCE-KR.md) | 한국 관할권 (자본시장법 / 배출권 거래법 / PIPA) |
| [docs/COMPLIANCE-CN.md](docs/COMPLIANCE-CN.md) | 중국 관할권 (Securities Law / PIPL / Carbon Trading) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 프로세스·모듈 맵 |
| [CHANGELOG.md](CHANGELOG.md) | 변경 이력 |
| [SECURITY.md](SECURITY.md) | Threat model |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 기여 가이드 |
| [LICENSE](LICENSE) | MIT |

---

## Truth boundary

- 공식 공개 API가 확인되지 않은 출처는 `Public API`가 아닌 `Official Web` 또는 `Official File`로 라벨.
- 상장 테이프가 공개 차트 피드로만 확보되면 **listed proxy** 또는 **linked tape**로 라벨하고 공식 탄소 출처와 분리.
- 시나리오·신호 출력은 evidence-backed research support로 제한되며, 공식 사실을 위조하거나 execution assistance처럼 행동하지 않음.
- 중국 ETS 일일 거래소 페이지는 일부 환경에서 rate-limit/차단될 수 있어, 안정적 공식 피드가 닿기 전까지 China 레이어는 bulletin-first.
- Institutional 피드 어댑터 (Refinitiv / Bloomberg / ICE / EEX)는 라이센스 미설정 시 `not-configured` 상태만 노출하고 가격을 추정하지 않음.
- Materials atlas의 비용·잠재력 수치는 모두 **범위로 인용**, 모든 entry는 초기 `verified: false` — 운영자 직접 검증 후에만 "Verified" 뱃지.

---

## License

[MIT](LICENSE) — third-party deps keep their own licenses.
