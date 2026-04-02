from pathlib import Path

import pandas as pd

import src.app as app_module
from src.data_engine import DataEngine


def _write_global_temperatures_csv(tmp_path: Path, rows: list[dict]) -> None:
    df = pd.DataFrame(rows)
    (tmp_path / "GlobalTemperatures.csv").write_text(
        df.to_csv(index=False), encoding="utf-8"
    )


def test_api_global_temp_success(tmp_path: Path, monkeypatch) -> None:
    _write_global_temperatures_csv(
        tmp_path,
        [
            {"dt": "1850-01-01", "LandAverageTemperature": 10.0},
            {"dt": "1850-02-01", "LandAverageTemperature": 14.0},
            {"dt": "1851-01-01", "LandAverageTemperature": 20.0},
        ],
    )

    # 用临时目录的数据引擎替换 app.py 里的全局 engine
    monkeypatch.setattr(app_module, "engine", DataEngine(data_path=str(tmp_path)))

    client = app_module.app.test_client()
    resp = client.get("/api/global-temp?min_year=1850")

    assert resp.status_code == 200
    data = resp.get_json()

    assert data["min_year"] == 1850
    assert data["years"] == [1850, 1851]
    assert data["temps"] == [12.0, 20.0]
    assert data["count"] == 2
