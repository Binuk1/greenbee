import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Graphs = ({ sensorData, lastUpdated, isFakeData }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('5m');

  // Generate mock historical data for the graph
  useEffect(() => {
    const generateHistoricalData = () => {
      const now = new Date();
      const newData = [];
      
      // Number of data points based on time range
      const points = timeRange === '5m' ? 12 : timeRange === '30m' ? 12 : 24;
      
      // Minutes between points based on time range
      const minutesBetween = timeRange === '5m' ? 1 : timeRange === '30m' ? 5 : 60;
      
      for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now - i * minutesBetween * 60 * 1000);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Add some randomness to make the graph more interesting
        const randomFactor = 0.8 + Math.random() * 0.4;
        const moisture = Math.min(3500, Math.max(1500, sensorData.moisture * randomFactor));
        const light = Math.min(4095, sensorData.light * randomFactor);
        const temperature = Math.min(45, Math.max(15, sensorData.temperature * (0.95 + Math.random() * 0.1)));
        const humidity = Math.min(100, Math.max(0, sensorData.humidity * (0.9 + Math.random() * 0.2)));
        
        newData.push({
          time: timeStr,
          moisture: Math.round(moisture),
          light: Math.round(light),
          temperature: parseFloat(temperature.toFixed(1)),
          humidity: Math.round(humidity),
          timestamp: time.getTime()
        });
      }
      
      return newData;
    };

    setData(generateHistoricalData());
  }, [sensorData, timeRange]);

  const formatYAxis = (tick) => {
    return tick.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p className="label">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color, margin: '5px 0' }}>
              {`${entry.name}: ${entry.value}${entry.name === 'temperature' ? '°C' : ''}${entry.name === 'humidity' ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="graphs-page">
      <header className="header">
        <h1>📈 GreenBee Sensor Graphs</h1>
        <p>
          Visualizing sensor data over time
          {isFakeData && <span className="fake-data-badge">DEMO MODE</span>}
        </p>
        <div className="time-range-selector">
          <button 
            className={`time-btn ${timeRange === '5m' ? 'active' : ''}`}
            onClick={() => setTimeRange('5m')}
          >
            5 Min
          </button>
          <button 
            className={`time-btn ${timeRange === '30m' ? 'active' : ''}`}
            onClick={() => setTimeRange('30m')}
          >
            30 Min
          </button>
          <button 
            className={`time-btn ${timeRange === '24h' ? 'active' : ''}`}
            onClick={() => setTimeRange('24h')}
          >
            24 Hours
          </button>
        </div>
      </header>

      <div className="dashboard">
        <div className="graph-container">
          <h2>🌡️ Temperature & Humidity</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#666' }}
                  tickMargin={10}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="#ff6b6b"
                  tickFormatter={formatYAxis}
                  domain={[0, 50]}
                  label={{ value: '°C', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#4dabf7"
                  domain={[0, 100]}
                  label={{ value: '%', angle: 90, position: 'insideRight' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="temperature" 
                  name="Temperature (°C)" 
                  stroke="#ff6b6b" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="humidity" 
                  name="Humidity (%)" 
                  stroke="#4dabf7" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="graph-container">
          <h2>💧 Soil Moisture</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#666' }}
                  tickMargin={10}
                />
                <YAxis 
                  domain={[1000, 4000]}
                  tickFormatter={formatYAxis}
                  label={{ value: 'Moisture', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="moisture" 
                  name="Soil Moisture" 
                  stroke="#5c7cfa" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="light" 
                  name="Light Level" 
                  stroke="#ffd43b" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default Graphs;
