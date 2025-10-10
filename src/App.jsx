import React, { useState, useEffect } from 'react';
import { database, ref, onValue } from '../firebase';
import './App.css';

function App() {
  const [sensorData, setSensorData] = useState({
    moisture: 0,
    light: 0,
    temperature: 0,
    humidity: 0,
    pump_active: false,
    needs_watering: false,
    timestamp: 0,
    wifi_strength: 0,
    dht_error: false,
    dht_error_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const sensorRef = ref(database, 'sensors/current');
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData({
          moisture: data.moisture || 0,
          light: data.light || 0,
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          pump_active: data.pump_active || false,
          needs_watering: data.needs_watering || false,
          timestamp: data.timestamp || 0,
          wifi_strength: data.wifi_strength || 0,
          dht_error: data.dht_error || false,
          dht_error_count: data.dht_error_count || 0
        });
        setLastUpdated(new Date());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // FIXED: Correct timestamp conversion
  const getLastUpdateTime = () => {
    if (!sensorData.timestamp) return 'Unknown';
    
    // ESP32 sends seconds, convert to milliseconds for Date object
    const timestampMs = sensorData.timestamp * 1000;
    const updateTime = new Date(timestampMs);
    
    // Check if timestamp is reasonable (not from 1970)
    const now = new Date();
    const timeDiff = now - updateTime;
    
    if (timeDiff > 24 * 60 * 60 * 1000) { // More than 24 hours ago
      return 'Timestamp unavailable';
    }
    
    return updateTime.toLocaleTimeString();
  };

  const moisturePercentage = Math.min(100, Math.max(0, (sensorData.moisture - 1500) / (3500 - 1500) * 100));
  const lightPercentage = Math.min(100, Math.max(0, sensorData.light / 4095 * 100));

  const getWifiQuality = (rssi) => {
    if (rssi >= -50) return { quality: 'Excellent', level: 100 };
    if (rssi >= -60) return { quality: 'Good', level: 75 };
    if (rssi >= -70) return { quality: 'Fair', level: 50 };
    if (rssi >= -80) return { quality: 'Weak', level: 25 };
    return { quality: 'Poor', level: 10 };
  };

  const getTemperatureStatus = (temp) => {
    if (temp < 15) return { status: 'COLD', class: 'cold' };
    if (temp > 30) return { status: 'HOT', class: 'hot' };
    return { status: 'GOOD', class: 'good' };
  };

  const getHumidityStatus = (humidity) => {
    if (humidity < 30) return { status: 'LOW', class: 'low' };
    if (humidity > 70) return { status: 'HIGH', class: 'high' };
    return { status: 'GOOD', class: 'good' };
  };

  const wifiInfo = getWifiQuality(sensorData.wifi_strength);
  const tempInfo = getTemperatureStatus(sensorData.temperature);
  const humidityInfo = getHumidityStatus(sensorData.humidity);

  if (loading) {
    return (
      <div className="loading">
        <h2>🌱 Connecting to GreenBee...</h2>
        <p>Waiting for sensor data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌿 GreenBee Plant Monitor</h1>
        <p>Real-time plant monitoring dashboard</p>
      </header>

      <div className="dashboard">
        {/* Moisture Card */}
        <div className="card moisture-card">
          <div className="card-header">
            <h2>💧 Soil Moisture</h2>
            <span className={`status ${sensorData.needs_watering ? 'low' : 'good'}`}>
              {sensorData.needs_watering ? 'DRY' : 'OK'}
            </span>
          </div>
          <div className="card-content">
            <div className="value">{sensorData.moisture}</div>
            <div className="percentage-bar">
              <div 
                className="percentage-fill"
                style={{ width: `${moisturePercentage}%` }}
              ></div>
            </div>
            <div className="percentage">{moisturePercentage.toFixed(1)}%</div>
            <div className="threshold-info">
              Threshold: 2000 | Current: {sensorData.moisture}
            </div>
          </div>
        </div>

        {/* Light Card */}
        <div className="card light-card">
          <div className="card-header">
            <h2>☀️ Light Level</h2>
            <span className={`status ${lightPercentage < 20 ? 'low' : 'good'}`}>
              {lightPercentage > 50 ? 'POOR' : 'GOOD'}
            </span>
          </div>
          <div className="card-content">
            <div className="value">{sensorData.light}</div>
            <div className="percentage-bar">
              <div 
                className="percentage-fill"
                style={{ width: `${lightPercentage}%` }}
              ></div>
            </div>
            <div className="percentage">{lightPercentage.toFixed(1)}%</div>
          </div>
        </div>

        {/* Temperature Card */}
        <div className="card temperature-card">
          <div className="card-header">
            <h2>🌡️ Temperature</h2>
            <span className={`status ${tempInfo.class}`}>
              {sensorData.dht_error ? 'ERROR' : tempInfo.status}
            </span>
          </div>
          <div className="card-content">
            {sensorData.dht_error ? (
              <div className="sensor-error">
                <div className="error-icon">❌</div>
                <div className="error-message">
                  DHT Sensor Error
                  <small>Count: {sensorData.dht_error_count}</small>
                </div>
              </div>
            ) : (
              <>
                <div className="value">{sensorData.temperature.toFixed(1)}°C</div>
                <div className="temperature-gauge">
                  <div className="gauge-background">
                    <div 
                      className="gauge-fill"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, (sensorData.temperature / 40) * 100))}%` 
                      }}
                    ></div>
                  </div>
                  <div className="gauge-labels">
                    <span>0°C</span>
                    <span>20°C</span>
                    <span>40°C</span>
                  </div>
                </div>
                <div className="range-info">
                  Ideal: 15°C - 30°C
                </div>
              </>
            )}
          </div>
        </div>

        {/* Humidity Card */}
        <div className="card humidity-card">
          <div className="card-header">
            <h2>💦 Air Humidity</h2>
            <span className={`status ${humidityInfo.class}`}>
              {sensorData.dht_error ? 'ERROR' : humidityInfo.status}
            </span>
          </div>
          <div className="card-content">
            {sensorData.dht_error ? (
              <div className="sensor-error">
                <div className="error-icon">❌</div>
                <div className="error-message">
                  DHT Sensor Error
                  <small>Count: {sensorData.dht_error_count}</small>
                </div>
              </div>
            ) : (
              <>
                <div className="value">{sensorData.humidity.toFixed(1)}%</div>
                <div className="percentage-bar">
                  <div 
                    className="percentage-fill"
                    style={{ width: `${sensorData.humidity}%` }}
                  ></div>
                </div>
                <div className="range-info">
                  Ideal: 30% - 70%
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pump Status Card */}
        <div className="card pump-card">
          <div className="card-header">
            <h2>🚰 Water Pump</h2>
            <span className={`status ${sensorData.pump_active ? 'active' : 'inactive'}`}>
              {sensorData.pump_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="card-content">
            <div className={`pump-icon ${sensorData.pump_active ? 'active' : ''}`}>
              💦
            </div>
            <p>{sensorData.pump_active ? 'Watering plant...' : 'Pump is off'}</p>
            <div className="watering-status">
              {sensorData.needs_watering && !sensorData.pump_active ? 
                'Waiting for next watering cycle' : ''}
            </div>
          </div>
        </div>

        {/* System Status Card */}
        <div className="card system-card">
          <div className="card-header">
            <h2>⚙️ System Status</h2>
          </div>
          <div className="card-content">
            <div className="status-item">
              <span className="label">WiFi Signal:</span>
              <span className="value">
                {sensorData.wifi_strength} dBm ({wifiInfo.quality})
              </span>
              <div className="wifi-bar">
                <div 
                  className="wifi-strength"
                  style={{ width: `${wifiInfo.level}%` }}
                ></div>
              </div>
            </div>
            <div className="status-item">
              <span className="label">DHT Sensor:</span>
              <span className={`value ${sensorData.dht_error ? 'error' : 'good'}`}>
                {sensorData.dht_error ? `ERROR (${sensorData.dht_error_count})` : 'HEALTHY'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Last Sensor Update:</span>
              <span className="value">{getLastUpdateTime()}</span>
            </div>
            <div className="status-item">
              <span className="label">Uptime:</span>
              <span className="value">
                {sensorData.timestamp ? formatUptime(sensorData.timestamp) : 'Unknown'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Watering Needed:</span>
              <span className={`value ${sensorData.needs_watering ? 'warning' : 'good'}`}>
                {sensorData.needs_watering ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Raw Data Card */}
        <div className="card data-card">
          <div className="card-header">
            <h2>📊 Raw Sensor Data</h2>
          </div>
          <div className="card-content">
            <pre>{JSON.stringify(sensorData, null, 2)}</pre>
            <div className="debug-info">
              <p>Raw timestamp: {sensorData.timestamp}</p>
              <p>Converted: {getLastUpdateTime()}</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Dashboard updated: {lastUpdated.toLocaleTimeString()}</p>
        <p>Sensor data timestamp: {getLastUpdateTime()}</p>
      </footer>
    </div>
  );
}

// Helper function to format uptime
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export default App;