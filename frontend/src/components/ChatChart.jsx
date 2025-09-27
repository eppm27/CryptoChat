import React from "react";
import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Colors for pie charts and multiple data series
const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

const ChatChart = React.memo(({ visualization }) => {
  console.log("📊 ChatChart received visualization:", visualization);

  if (!visualization || !visualization.dataPoints?.length) {
    console.log("❌ ChatChart: No visualization or dataPoints");
    return null;
  }

  const { type = "line", dataPoints } = visualization;
  console.log("📊 Chart type:", type, "DataPoints count:", dataPoints.length);
  console.log("📊 First few dataPoints:", dataPoints.slice(0, 3));
  console.log("📊 Last few dataPoints:", dataPoints.slice(-3));

  // Handle different data formats based on chart type
  const prepareChartData = () => {
    if (type === "pie") {
      // Pie chart expects labels and datasets format
      return (
        dataPoints.labels?.map((label, index) => ({
          name: label,
          value: dataPoints.datasets?.[0]?.data?.[index] || 0,
        })) || []
      );
    }

    if (type === "bar") {
      // Bar chart expects labels and datasets format
      return (
        dataPoints.labels?.map((label, index) => ({
          name: label,
          value: dataPoints.datasets?.[0]?.data?.[index] || 0,
        })) || []
      );
    }

    if (type === "candlestick") {
      // Candlestick data has open, high, low, close
      return dataPoints
        .map((point) => ({
          time: new Date(point.time).toLocaleDateString(),
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          fullTime: new Date(point.time),
        }))
        .sort((a, b) => a.fullTime - b.fullTime);
    }

    // Default line chart format - sample data if too many points
    let processedData = dataPoints
      .map((point) => ({
        time: new Date(point.time).toLocaleDateString(),
        price: point.price || point.volume,
        volume: point.volume,
        fullTime: new Date(point.time),
      }))
      .sort((a, b) => a.fullTime - b.fullTime);

    // Sample data if there are too many points to improve performance
    if (processedData.length > 100) {
      const step = Math.ceil(processedData.length / 100);
      processedData = processedData.filter((_, index) => index % step === 0);
      console.log(
        "📊 Sampled data from",
        dataPoints.length,
        "to",
        processedData.length,
        "points"
      );
    }

    return processedData;
  };

  const chartData = prepareChartData();
  console.log("📊 Final chartData:", chartData.length, "points");
  console.log("📊 Sample chartData:", chartData.slice(0, 2));

  // Calculate padding for Y-axis
  const getYAxisDomain = () => {
    if (type === "candlestick" && chartData.length > 0) {
      const lows = chartData.map((d) => d.low).filter((v) => v != null);
      const highs = chartData.map((d) => d.high).filter((v) => v != null);
      if (lows.length && highs.length) {
        const minPrice = Math.min(...lows);
        const maxPrice = Math.max(...highs);
        const padding = (maxPrice - minPrice) * 0.1;
        return [Math.max(0, minPrice - padding), maxPrice + padding];
      }
    }

    if (type === "line" && chartData.length > 0) {
      const prices = chartData
        .map((d) => d.price || d.volume)
        .filter((v) => v != null);
      if (prices.length) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const padding = (maxPrice - minPrice) * 0.1;
        return [Math.max(0, minPrice - padding), maxPrice + padding];
      }
    }

    return ["dataMin", "dataMax"];
  };

  const yAxisDomain = getYAxisDomain();

  const renderChart = () => {
    switch (type) {
      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Value"]} />
          </PieChart>
        );

      case "bar":
        return (
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fill: "#6b7280" }} tickMargin={10} />
            <YAxis
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              tickMargin={10}
            />
            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Value"]} />
            <Legend />
            <Bar dataKey="value" fill={COLORS[0]} />
          </BarChart>
        );

      case "candlestick":
        // For candlestick, we'll use a simplified representation with high-low bars
        return (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fill: "#6b7280" }} tickMargin={10} />
            <YAxis
              domain={yAxisDomain}
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              tickMargin={10}
            />
            <Tooltip
              formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="open"
              stroke={COLORS[0]}
              strokeWidth={1}
              dot={false}
              name="Open"
            />
            <Line
              type="monotone"
              dataKey="high"
              stroke={COLORS[1]}
              strokeWidth={1}
              dot={false}
              name="High"
            />
            <Line
              type="monotone"
              dataKey="low"
              stroke={COLORS[2]}
              strokeWidth={1}
              dot={false}
              name="Low"
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={COLORS[3]}
              strokeWidth={2}
              dot={false}
              name="Close"
            />
          </LineChart>
        );

      default: // line chart
        return (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fill: "#6b7280" }} tickMargin={10} />
            <YAxis
              domain={yAxisDomain}
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              tickMargin={10}
              allowDataOverflow={true}
            />
            <Tooltip
              formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              activeDot={{ r: 3 }}
              dot={false}
              name={
                chartData[0]?.volume !== undefined ? "Volume" : "Price(AUD)"
              }
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      {visualization.title && (
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {visualization.title}
        </h3>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-[900px] h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

ChatChart.displayName = "ChatChart";

ChatChart.propTypes = {
  visualization: PropTypes.shape({
    type: PropTypes.oneOf(["line", "bar", "pie", "candlestick"]),
    title: PropTypes.string,
    dataPoints: PropTypes.oneOfType([
      // For line and candlestick charts
      PropTypes.arrayOf(
        PropTypes.shape({
          time: PropTypes.string,
          price: PropTypes.number,
          volume: PropTypes.number,
          open: PropTypes.number,
          high: PropTypes.number,
          low: PropTypes.number,
          close: PropTypes.number,
        })
      ),
      // For bar and pie charts (different format)
      PropTypes.shape({
        labels: PropTypes.arrayOf(PropTypes.string),
        datasets: PropTypes.arrayOf(
          PropTypes.shape({
            data: PropTypes.arrayOf(PropTypes.number),
          })
        ),
      }),
    ]).isRequired,
  }),
};

export default ChatChart;
