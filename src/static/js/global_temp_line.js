(function () {
  const globalChartDom = document.getElementById("globalTempChart");
  const globalMsgDom = document.getElementById("msg");
  const minYearInput = document.getElementById("minYear");
  const reloadBtn = document.getElementById("reloadBtn");

  const cityChartDom = document.getElementById("cityTempChart");
  const cityMsgDom = document.getElementById("cityMsg");
  const cityYearInput = document.getElementById("cityYear");
  const cityLimitInput = document.getElementById("cityLimit");
  const reloadCityBtn = document.getElementById("reloadCityBtn");

  const globalChart = echarts.init(globalChartDom);
  const cityChart = echarts.init(cityChartDom);

  function setMessage(dom, text, isError) {
    dom.textContent = text || "";
    dom.style.color = isError ? "#d9534f" : "#666";
  }

  async function loadGlobalTemp() {
    const minYear = Number(minYearInput.value || 1850);
    setMessage(globalMsgDom, "加载中...", false);

    try {
      const resp = await fetch("/api/global-temp?min_year=" + minYear);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "请求失败");
      }

      const temps = data.temps || [];
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const span = maxTemp - minTemp;
      const padding = Math.max(span * 0.1, 0.2);
      const yMin = Number((minTemp - padding).toFixed(2));
      const yMax = Number((maxTemp + padding).toFixed(2));

      const option = {
        title: { text: "全球陆地平均温度变化（年均）", left: "center" },
        tooltip: { trigger: "axis" },
        grid: { left: 50, right: 20, top: 60, bottom: 60 },
        xAxis: {
          type: "category",
          name: "年份",
          data: data.years,
        },
        yAxis: {
          type: "value",
          name: "温度 (°C)",
          min: yMin,
          max: yMax,
          scale: true,
          axisLabel: { formatter: "{value} °C" },
        },
        dataZoom: [{ type: "inside" }, { type: "slider", bottom: 20 }],
        series: [
          {
            name: "年均温",
            type: "line",
            smooth: true,
            showSymbol: false,
            data: data.temps,
            lineStyle: { width: 2 },
          },
        ],
      };

      globalChart.setOption(option, true);
      setMessage(globalMsgDom, "加载完成，共 " + data.count + " 条年度记录。", false);
    } catch (err) {
      setMessage(globalMsgDom, "加载失败：" + err.message, true);
    }
  }

  async function loadCityTemp() {
    const year = Number(cityYearInput.value || 2013);
    const limit = Number(cityLimitInput.value || 20);
    setMessage(cityMsgDom, "加载中...", false);

    try {
      const resp = await fetch(`/api/city-temp?year=${year}&limit=${limit}`);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "请求失败");
      }

      const option = {
        title: { text: `${year} 年城市平均温度（按温度排序）`, left: "center" },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: 60, right: 20, top: 60, bottom: 80 },
        xAxis: {
          type: "category",
          name: "城市",
          data: data.cities,
          axisLabel: { interval: 0, rotate: 30 },
        },
        yAxis: {
          type: "value",
          name: "温度 (°C)",
          axisLabel: { formatter: "{value} °C" },
          scale: true,
        },
        series: [
          {
            name: "平均温度",
            type: "bar",
            data: data.temps,
            itemStyle: { color: "#5470C6" },
          },
        ],
      };

      cityChart.setOption(option, true);
      setMessage(cityMsgDom, "加载完成，共 " + data.count + " 个城市。", false);
    } catch (err) {
      setMessage(cityMsgDom, "加载失败：" + err.message, true);
    }
  }

  reloadBtn.addEventListener("click", loadGlobalTemp);
  reloadCityBtn.addEventListener("click", loadCityTemp);

  window.addEventListener("resize", function () {
    globalChart.resize();
    cityChart.resize();
  });

  loadGlobalTemp();
  loadCityTemp();
})();
