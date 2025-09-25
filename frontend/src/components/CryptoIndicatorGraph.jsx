import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchCryptoIndicatorGraph } from "../services/cryptoAPI";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

const RSIChart = ({ cryptoId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const yMin = 30; // Define RSI lower bound
  const yMax = 70; // Define RSI upper bound

  // Fetch data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const jsonResponse = await fetchCryptoIndicatorGraph(cryptoId);

        // Transform backend data to match Recharts format
        if (jsonResponse && jsonResponse.rsiData) {
          const formattedData = jsonResponse.rsiData.map((item) => ({
            name: new Date(item.x).toLocaleDateString(),
            value: item.y,
            timestamp: item.x,
          }));

          // Sort by timestamp to ensure correct order
          formattedData.sort((a, b) => a.timestamp - b.timestamp);

          setData(formattedData);
        } else {
          setError("Sorry! No data available");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load tech ind");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cryptoId]);
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        Loading RSI data...
      </div>
    );
  }

  if (error) {
    return <div className="h-64 flex items-center justify-center">{error}</div>;
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        No RSI data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        width={600}
        height={300}
        data={data}
        margin={{
          top: 10,
          right: 0,
          left: -10,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12 }}
          interval={Math.ceil(data.length / 10)}
        />
        <YAxis />
        <Tooltip />
        <Legend
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{
            paddingTop: "20px",
          }}
        />
        {/* Add shaded reference area */}
        <ReferenceArea
          y1={yMin}
          y2={yMax}
          strokeOpacity={0.3}
          fill="#87CEFA"
          fillOpacity={0.2}
        />
        <Line
          type="monotone"
          dataKey="value"
          name="RSI Value"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
          dot={{ r: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

RSIChart.propTypes = {
  cryptoId: PropTypes.string.isRequired,
};
export default RSIChart;

// chart template from https://recharts.org/en-US/examples/SimpleLineChart
