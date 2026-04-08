import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor


MARKET_PRIORITY_FEATURES = {
    "eu-ets": [
        "ttf_gas",
        "power_price",
        "coal_price",
        "auction_cover",
        "open_interest",
        "policy_flag",
    ],
    "k-ets": [
        "kcu_close",
        "koc_close",
        "auction_cover",
        "usdkrw",
        "compliance_flag",
        "policy_flag",
    ],
    "cn-ets": [
        "coal_price",
        "lng_price",
        "power_price",
        "aqi",
        "sector_expansion_flag",
        "policy_flag",
    ],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--market", required=True)
    parser.add_argument("--train-window", type=int, default=180)
    parser.add_argument("--horizon", type=int, default=1)
    return parser.parse_args()


def load_dataframe(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path)
    if "date" not in frame.columns or "close" not in frame.columns:
        raise ValueError("CSV must include `date` and `close` columns.")

    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    frame = frame.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

    for column in frame.columns:
        if column != "date":
            frame[column] = pd.to_numeric(frame[column], errors="coerce")

    if frame["close"].isna().any():
        raise ValueError("`close` column must be numeric for all rows.")

    return frame


def engineer_features(
    frame: pd.DataFrame, horizon: int
) -> tuple[pd.DataFrame, pd.DataFrame, list[str]]:
    working = frame.copy()
    numeric_columns = [column for column in working.columns if column != "date"]

    for lag in (1, 2, 5, 10, 20):
        working[f"close_lag_{lag}"] = working["close"].shift(lag)

    working["return_1"] = working["close"].pct_change(1)
    working["return_5"] = working["close"].pct_change(5)
    working["return_20"] = working["close"].pct_change(20)
    working["rolling_mean_5"] = working["close"].rolling(5).mean()
    working["rolling_mean_20"] = working["close"].rolling(20).mean()
    working["rolling_std_5"] = working["close"].rolling(5).std()
    working["rolling_std_20"] = working["close"].rolling(20).std()

    for column in numeric_columns:
        if column == "close":
            continue
        working[f"{column}_lag_1"] = working[column].shift(1)

    working["target"] = working["close"].shift(-horizon)
    feature_columns = [
        column for column in working.columns if column not in {"date", "target"}
    ]
    engineered = working.dropna(subset=feature_columns + ["target"]).reset_index(drop=True)
    latest_scoring_row = working.dropna(subset=feature_columns).reset_index(drop=True)
    return engineered, latest_scoring_row, feature_columns


def select_features(frame: pd.DataFrame, market: str) -> list[str]:
    priority = [
        feature
        for feature in MARKET_PRIORITY_FEATURES.get(market, [])
        if feature in frame.columns
    ]
    engineered = [
        feature
        for feature in frame.columns
        if feature not in {"date", "target"} and pd.api.types.is_numeric_dtype(frame[feature])
    ]
    deduped = []
    for feature in priority + engineered:
        if feature not in deduped:
            deduped.append(feature)
    return deduped


def walk_forward_train(
    frame: pd.DataFrame, features: list[str], train_window: int
) -> tuple[list[float], list[float], list[float]]:
    predictions: list[float] = []
    actuals: list[float] = []
    anchors: list[float] = []

    for index in range(train_window, len(frame)):
        train = frame.iloc[index - train_window : index]
        test = frame.iloc[index : index + 1]

        model = GradientBoostingRegressor(random_state=42)
        model.fit(train[features], train["target"])
        prediction = float(model.predict(test[features])[0])

        predictions.append(prediction)
        actuals.append(float(test["target"].iloc[0]))
        anchors.append(float(test["close"].iloc[0]))

    return predictions, actuals, anchors


def final_fit_predict(
    frame: pd.DataFrame,
    latest_row: pd.DataFrame,
    features: list[str],
    train_window: int,
) -> tuple[float, np.ndarray]:
    model = GradientBoostingRegressor(random_state=42)
    train = frame.iloc[-train_window:]
    model.fit(train[features], train["target"])

    latest_features = latest_row.iloc[[-1]][features]
    next_prediction = float(model.predict(latest_features)[0])
    importances = getattr(model, "feature_importances_", np.zeros(len(features)))
    return next_prediction, importances


def safe_pct_error(actuals: np.ndarray, predictions: np.ndarray) -> float:
    mask = actuals != 0
    if not mask.any():
        return 0.0
    values = np.abs((actuals[mask] - predictions[mask]) / actuals[mask]) * 100
    return float(values.mean())


def main() -> None:
    args = parse_args()
    csv_path = Path(args.input)
    if not csv_path.exists():
        raise FileNotFoundError(f"Missing input file: {csv_path}")

    raw = load_dataframe(csv_path)
    engineered, latest_scoring_row, feature_columns = engineer_features(raw, args.horizon)
    features = select_features(engineered, args.market)

    if len(engineered) < max(args.train_window + 20, 80):
        raise ValueError("Not enough rows after feature engineering for walk-forward training.")

    predictions, actuals, anchors = walk_forward_train(
        engineered, features, args.train_window
    )

    actual_array = np.array(actuals)
    prediction_array = np.array(predictions)
    anchor_array = np.array(anchors)
    residuals = actual_array - prediction_array

    mae = float(np.mean(np.abs(residuals)))
    rmse = float(np.sqrt(np.mean(np.square(residuals))))
    mape = safe_pct_error(actual_array, prediction_array)
    directional = np.sign(actual_array - anchor_array) == np.sign(prediction_array - anchor_array)
    directional_accuracy = float(np.mean(directional) * 100)

    next_prediction, importances = final_fit_predict(
        engineered, latest_scoring_row, features, args.train_window
    )
    latest_close = float(raw["close"].iloc[-1])
    error_band = rmse if np.isfinite(rmse) else 0.0

    feature_ranking = sorted(
        [
            {"feature": feature, "importance": float(importance)}
            for feature, importance in zip(features, importances)
        ],
        key=lambda item: item["importance"],
        reverse=True,
    )

    payload = {
        "summary": {
            "rows": int(len(raw)),
            "trainWindow": int(args.train_window),
            "horizon": int(args.horizon),
            "mae": mae,
            "rmse": rmse,
            "mapePct": mape,
            "directionalAccuracyPct": directional_accuracy,
            "latestClose": latest_close,
            "nextPrediction": next_prediction,
            "lowerBand": next_prediction - error_band,
            "upperBand": next_prediction + error_band,
        },
        "selectedFeatures": features,
        "topFeatures": feature_ranking[:10],
        "warnings": [
            "This is a local walk-forward model for research use. Production trading requires licensed data, regime validation, and execution controls."
        ],
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
