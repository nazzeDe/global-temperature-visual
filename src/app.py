from flask import Flask, jsonify, render_template, request

from .data_engine import DataEngine

app = Flask(__name__)
engine = DataEngine()


@app.route("/")
def index():
    return render_template("index.html")


@app.get("/api/global-temp")
def api_global_temp():
    min_year_raw = request.args.get("min_year", default="1850")
    try:
        min_year = int(min_year_raw)
    except ValueError:
        return jsonify({"error": "min_year 必须是整数"}), 400

    try:
        df = engine.get_global_temp(min_year=min_year)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"service error:{e}"}), 500

    payload = {
        "min_year": min_year,
        "years": df["year"].astype(int).tolist(),
        "temps": df["temperature"].astype(float).round(1).tolist(),
        "count": len(df),
    }
    return jsonify(payload)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
