# C-Quant Data Schema

## 목적

이 스키마는 **reviewer-facing track**용입니다. 외부 분석가가 자신의 라벨드 driver-history 패널을 [src/lib/walkForward.ts](../src/lib/walkForward.ts)에 plug-in해서 forecast estimator를 검증할 때 쓰는 canonical column 체계를 고정합니다.

데스크톱 앱의 사용자 surface(`Command` / `Drivers` / `Desk` / `Sources`)는 이 스키마를 직접 노출하지 않습니다. 앱은 이벤트-study 기반의 catalyst calibration([src/data/catalystEventLog.ts](../src/data/catalystEventLog.ts) + [src/data/historicalPriceAnchors.ts](../src/data/historicalPriceAnchors.ts) → [src/lib/eventStudy.ts](../src/lib/eventStudy.ts) → [src/data/catalystCalibration.ts](../src/data/catalystCalibration.ts))을 사용합니다.

retired된 Lab 화면(CSV 업로드 + 워크포워드 러너 UI)은 v1.2 시점에 제거됐고 다시 도입하지 않습니다. 본 스키마는 그 대신 **외부 검토자가 `runWalkForward`를 자신의 데이터로 직접 실행**할 때만 적용됩니다.

## 1. Canonical storage tables

SQL 정의는 [db/schema.sql](../db/schema.sql)에 있습니다.

**현재 상태 (2026-05-06 검증)**: 위 스키마는 **aspirational seed**입니다. `src/`, `electron/`, `scripts/`, `tools/` 어디에도 이 테이블들을 읽거나 쓰는 코드가 없습니다. 검토자가 자신의 PostgreSQL/JSONB 환경에 동일 컬럼 체계를 도입하고 싶을 때의 골격으로만 사용하세요.

- `market_daily_features`
  - 시장별 일간 정규화 feature store
  - 공통 필드는 `market_id`, `trading_date`, `close`, `volume`
  - 시장별 추가 컬럼은 `feature_payload` JSONB에 저장
  - **코드 정합**: [src/lib/walkForward.ts](../src/lib/walkForward.ts)의 `WalkForwardSample` (date / features map / observedReturn) 형식과 호환. `samplesFromPriceSeries`로 (close 시계열 + featuresByDate) → samples 변환 가능
- `policy_events`
  - 정책, 규제, 경매 제도, 시장안정화 이벤트 저장
  - **코드 정합 없음**: walkForward.ts는 정책 이벤트를 입력으로 받지 않음. 이벤트-study calibration은 [src/data/catalystEventLog.ts](../src/data/catalystEventLog.ts)(TS 상수)로 처리되며 SQL을 통하지 않음
- `model_runs`
  - 워크포워드 예측 모델 실행 결과와 설정 저장
  - **코드 정합 없음**: `runWalkForward`는 `WalkForwardReport` 객체를 반환할 뿐 어떤 DB에도 쓰지 않음. 이 테이블에 결과를 적재하려면 검토자가 별도 writer를 작성해야 함
- `feature_importance_snapshots`
  - 모델별 상위 중요 변수 저장
  - **코드 정합 없음**: walkForward.ts의 `WalkForwardReport`는 feature importance를 산출하지 않음. baseline 모델은 단순 weighted-sum이며 importance 추출 단계가 없음
- `backtest_runs`
  - 전략, 비용 가정, 성과지표 저장
  - **코드 정합 없음**: 전략 개념과 비용 가정을 다루는 backtest layer가 코드에 없음. [electron/backtests.js](../electron/backtests.js)는 generic JSON archive 인프라(`backtest-save/load/list/remove` IPC + [src/lib/BacktestDrawer.tsx](../src/lib/BacktestDrawer.tsx))를 제공하지만 **renderer에서 `desktopBridge.backtestSave(...)`를 호출하는 producer가 0개**(2026-05-06 grep). drawer는 따라서 기본 비어 있음. 이 표 컬럼을 채우려면 검토자가 직접 전략 backtest를 구현하고 `backtestSave`로 결과를 저장해야 함

## 2. Daily training table design

CSV 템플릿은 `templates/` 아래에 있습니다 — **입력 포맷 제안서**입니다. walkForward.ts에는 CSV reader가 없으므로 검토자가 직접 파싱해서 `WalkForwardSample[]`을 만들어야 합니다.

- [eu_ets_daily_template.csv](../templates/eu_ets_daily_template.csv)
  - 컬럼: `date, close, volume, auction_cover, ttf_gas, power_price, coal_price, brent, industrial_output, weather_index, open_interest, policy_flag`
- [k_ets_daily_template.csv](../templates/k_ets_daily_template.csv)
  - 컬럼: `date, close, volume, kcu_close, koc_close, auction_cover, wti, usdkrw, call_rate, kospi, compliance_flag, policy_flag`
- [cn_ets_daily_template.csv](../templates/cn_ets_daily_template.csv)
  - 컬럼: `date, close, volume, coal_price, lng_price, power_price, aqi, industrial_index, allocation_intensity, sector_expansion_flag, policy_flag`

- [eu_ets_daily_template.csv](../templates/eu_ets_daily_template.csv)
- [k_ets_daily_template.csv](../templates/k_ets_daily_template.csv)
- [cn_ets_daily_template.csv](../templates/cn_ets_daily_template.csv)

원칙:

- 날짜는 `date`
- 종가는 `close`
- 거래량은 `volume`
- 정책 이벤트는 `policy_flag`
- 컴플라이언스 시즌 변수는 `compliance_flag`
- 시장별 특수 변수는 snake_case로 통일

## 3. Ingestion rules

- 원천 데이터는 거래소, 공식 기관, 검증된 데이터 벤더만 사용
- 가격과 거래량은 결측 보간보다 원천 정합성 보존을 우선
- 정책 이벤트는 수동 검증 후 binary flag로 반영
- 모델 입력 전에는 timezone, 휴장일, 단위, 스플릿 없는지 검증

## 4. Model interface

[src/lib/walkForward.ts](../src/lib/walkForward.ts)는 (date, features, observedReturn) 튜플 배열을 받아 sign-of-prediction을 채점하는 generic harness입니다. **CSV/SQL을 직접 읽지 않으며**, 검토자가 자신의 데이터로 `WalkForwardSample[]`을 만들어 넣어야 합니다.

API 표면 (실제 타입 그대로):

```ts
type WalkForwardSample = {
  date: string;
  features: Record<string, number>;
  observedReturn: number;
};

runWalkForward({
  samples,
  trainingWindow,
  refitEvery?,
  noiseFloor?,
  model,
}): WalkForwardReport;

type WalkForwardReport = {
  predictions: WalkForwardPrediction[];
  evaluated: number;
  hits: number;
  misses: number;
  flats: number;
  hitRate: number | null;
  meanAbsReturn: number;
  sharpeApprox: number | null;
};
```

진행 흐름:

1. 검토자가 CSV(또는 자체 데이터)를 파싱해 `samples`를 만든다.
2. `samplesFromPriceSeries(series, featuresByDate)`로 close 시계열을 받아 1-step forward return을 자동 계산할 수도 있다.
3. `runWalkForward`가 rolling training window로 모델을 fit/predict하며 hits/misses, hitRate, meanAbsReturn, naive Sharpe를 반환한다.
4. **feature importance는 산출하지 않는다** — baseline 모델이 단순 weighted-sum이라 importance 단계가 없다. db/schema.sql의 `feature_importance_snapshots` 테이블은 이 harness의 output이 아니라 검토자가 별도 모델로 채워야 하는 자리이다.

여기서의 "예측"은 [src/lib/forecast.ts](../src/lib/forecast.ts)의 linear-weighted-sum estimator를 OOS로 검증하기 위한 출력입니다. 앱이 화면에 노출하는 catalyst posture / score build와는 별개의 evaluation track입니다 — catalyst layer는 [src/lib/eventStudy.ts](../src/lib/eventStudy.ts)와 [src/data/catalystEventLog.ts](../src/data/catalystEventLog.ts)로 calibrate되고, 이 walk-forward 인터페이스는 그것과 독립적으로 forecast estimator의 OOS 동작을 보고 싶은 외부 분석가를 위한 입구입니다.
