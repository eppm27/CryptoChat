import React from "react";
import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ChatChart = ({ visualization }) => {
  if (!visualization || !visualization.dataPoints?.length) return null;

  const chartData = visualization.dataPoints
    .map((point) => ({
      time: new Date(point.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      price: point.price,
      fullTime: new Date(point.time),
    }))
    .sort((a, b) => a.fullTime - b.fullTime);
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

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
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 50,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#6b7280" }}
                tickMargin={10}
              />
              <YAxis
                domain={[
                  (dataMin) => Math.max(0, dataMin - padding),
                  (dataMax) => dataMax + padding,
                ]}
                tick={{ fill: "#6b7280" }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                tickMargin={10}
                allowDataOverflow={true}
              />
              <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, "Price"]}
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
                name="Price(AUD)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

ChatChart.propTypes = {
  visualization: PropTypes.shape({
    type: PropTypes.string,
    title: PropTypes.string,
    dataPoints: PropTypes.arrayOf(
      PropTypes.shape({
        time: PropTypes.string,
        price: PropTypes.number,
      })
    ).isRequired,
  }),
};

export default ChatChart;
