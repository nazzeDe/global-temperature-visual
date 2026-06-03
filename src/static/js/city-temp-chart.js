(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const setStatus = (id, text, cls) => {
    const d = $(id);
    if (d) { d.textContent = text; d.className = "card-status " + (cls || ""); }
  };

  const loadingOpts = { text: "加载中...", color: "#4fc3f7", textColor: "#c8d6e5", maskColor: "rgba(15,25,35,0.8)" };

  let chartCity = null;

  const ensureChart = () => {
    const container = $("chartCityRanking");
    if (!container) return null;
    try {
      if (!chartCity) chartCity = echarts.init(container, null, { devicePixelRatio: 2 });
      return chartCity;
    } catch (e) {
      console.error("初始化城市图表失败", e);
      return null;
    }
  };

  const loadCityRanking = () => {
    const chart = ensureChart();
    if (!chart) return;
    const elYear = $("cityYearInput");
    const elCountry = $("cityCountrySelect");
    const year = parseInt(elYear && elYear.value, 10) || 2013;
    const country = (elCountry && elCountry.value) || "United States";
    const limit = 15;

    setStatus("statusCity", "正在加载...", "loading");
    chart.showLoading(loadingOpts);

    fetch(`/api/state-temp?year=${year}&limit=${limit}&country=${encodeURIComponent(country)}`)
      .then(r => r.json())
      .then(d => {
        const regions = d.states.slice().reverse();
        const temps = d.temps.slice().reverse();
        chart.setOption({
          backgroundColor: "#152238",
          title: { text: year + " 年省平均温度排名（前 " + limit + "）", left: "center", textStyle: { color: "#c8d6e5", fontSize: 15 } },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: p => p[0].name + "<br/>温度: " + p[0].value.toFixed(1) + " °C" },
          grid: { left: 100, right: 50, top: 50, bottom: 30 },
          xAxis: [{ type: "value", name: "温度 (°C)", axisLabel: { color: "#8a9bb5", formatter: "{value} °C" } }],
          yAxis: [{ type: "category", data: regions, axisLabel: { color: "#8a9bb5", fontSize: 11 } }],
          series: [{ type: "bar", barMaxWidth: 26, data: temps.map(v => ({ value: v, itemStyle: { color: v > 20 ? "#d9534f" : v > 10 ? "#ffab40" : "#4fc3f7" } })) }],
        }, true);
        chart.hideLoading();
        setStatus("statusCity", "加载完成（" + year + " 年, " + d.count + " 省）", "ok");
      })
      .catch(err => {
        chart.hideLoading();
        setStatus("statusCity", "加载失败: " + (err && err.message ? err.message : err), "error");
      });
  };

  const start = () => {
    ensureChart();
    const btn = $("reloadCityBtn");
    if (btn) btn.addEventListener("click", loadCityRanking);
    // 支持按国家选择后立即刷新
    const sel = $("cityCountrySelect");
    if (sel) sel.addEventListener("change", loadCityRanking);
    loadCityRanking();
    window.addEventListener("resize", () => { try { if (chartCity) chartCity.resize(); } catch (e) {} });
  };

  if (document.readyState === "complete") setTimeout(start, 100);
  else window.addEventListener("load", () => setTimeout(start, 100));
})();
