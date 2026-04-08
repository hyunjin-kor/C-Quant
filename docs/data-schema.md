# C-Quant Data Schema

## 목적

데스크톱 앱에서 보는 리서치 화면과 실제 예측/백테스트 파이프라인이 같은 컬럼 체계를 쓰도록 canonical schema를 고정합니다.

## 1. Canonical storage tables

SQL 정의는 [db/schema.sql](../db/schema.sql)에 있습니다.

- `market_daily_features`
  - 시장별 일간 정규화 feature store
  - 공통 필드는 `market_id`, `trading_date`, `close`, `volume`
  - 시장별 추가 컬럼은 `feature_payload` JSONB에 저장
- `policy_events`
  - 정책, 규제, 경매 제도, 시장안정화 이벤트 저장
- `model_runs`
  - 워크포워드 예측 모델 실행 결과와 설정 저장
- `feature_importance_snapshots`
  - 모델별 상위 중요 변수 저장
- `backtest_runs`
  - 전략, 비용 가정, 성과지표 저장

## 2. Daily training table design

앱에서 바로 쓰는 CSV 템플릿은 `templates/` 아래에 있습니다.

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

워크포워드 모델은 CSV 한 개를 받아 다음을 수행합니다.

1. 수치 컬럼 자동 탐지
2. lag/return/rolling 특징 생성
3. rolling train window 기반 재학습
4. 예측 오차와 방향성 정확도 계산
5. 최신 시점 다음 값 예측과 중요 변수 반환
