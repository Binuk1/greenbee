import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [sensorData, setSensorData] = useState({
    moisture: 1800,
    light: 2000,
    temperature: 25,
    humidity: 60,
    pump_active: false,
    needs_watering: false,
    water_level: 800,
    timestamp: Math.floor(Date.now() / 1000),
    wifi_strength: -55,
    dht_error: false,
    dht_error_count: 0
  })
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => {
        const noise = (base, range) => base + (Math.random() - 0.5) * range

        const newWaterLevel = prev.pump_active
          ? clamp(prev.water_level - (Math.random() * 20 + 20), 0, 1000)
          : clamp(prev.water_level + (Math.random() * 0.5 - 0.25), 0, 1000)

        const updated = {
          moisture: clamp(noise(prev.moisture, 100), 1000, 3500),
          light: clamp(noise(prev.light, 150), 0, 4095),
          temperature: clamp(noise(prev.temperature, 0.5), 10, 40),
          humidity: clamp(noise(prev.humidity, 2), 20, 90),
          pump_active: Math.random() > 0.9 ? !prev.pump_active : prev.pump_active,
          needs_watering: prev.moisture < 1800,
          water_level: newWaterLevel,
          timestamp: Math.floor(Date.now() / 1000),
          wifi_strength: Math.round(clamp(noise(prev.wifi_strength, 2), -80, -40)),
          dht_error: Math.random() > 0.98 ? !prev.dht_error : prev.dht_error,
          dht_error_count: prev.dht_error ? prev.dht_error_count + 1 : 0
        }

        return updated
      })
      setLastUpdated(new Date())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const getLastUpdateTime = () => new Date(sensorData.timestamp * 1000).toLocaleTimeString()
  const moisturePercentage = Math.min(100, Math.max(0, (sensorData.moisture - 1500) / (3500 - 1500) * 100))
  const lightPercentage = Math.min(100, Math.max(0, sensorData.light / 4095 * 100))
  const waterPercentage = Math.min(100, (sensorData.water_level / 1000) * 100)

  const getWifiQuality = (rssi) => {
    if (rssi >= -50) return { quality: 'Excellent', level: 100 }
    if (rssi >= -60) return { quality: 'Good', level: 75 }
    if (rssi >= -70) return { quality: 'Fair', level: 50 }
    if (rssi >= -80) return { quality: 'Weak', level: 25 }
    return { quality: 'Poor', level: 10 }
  }

  const getTemperatureStatus = (temp) => {
    if (temp < 15) return { status: 'COLD', class: 'cold' }
    if (temp > 30) return { status: 'HOT', class: 'hot' }
    return { status: 'GOOD', class: 'good' }
  }

  const getHumidityStatus = (humidity) => {
    if (humidity < 30) return { status: 'LOW', class: 'low' }
    if (humidity > 70) return { status: 'HIGH', class: 'high' }
    return { status: 'GOOD', class: 'good' }
  }

  const wifiInfo = getWifiQuality(sensorData.wifi_strength)
  const tempInfo = getTemperatureStatus(sensorData.temperature)
  const humidityInfo = getHumidityStatus(sensorData.humidity)

  return (
    <div className="app">
      <header className="header">
        <h1>🌿 GreenBee Plant Monitor</h1>
        <p>Sensor values drift smoothly over time</p>
      </header>

      <div className="dashboard">
        <div className="card moisture-card">
          <div className="card-header">
            <h2>💧 Soil Moisture</h2>
            <span className={`status ${sensorData.needs_watering ? 'low' : 'good'}`}>
              {sensorData.needs_watering ? 'DRY' : 'OK'}
            </span>
          </div>
          <div className="card-content">
            <div className="value">{sensorData.moisture.toFixed(0)}</div>
            <div className="percentage-bar">
              <div className="percentage-fill" style={{ width: `${moisturePercentage}%` }}></div>
            </div>
            <div className="percentage">{moisturePercentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="card light-card">
          <div className="card-header">
            <h2>☀️ Light Level</h2>
            <span className={`status ${lightPercentage < 20 ? 'low' : 'good'}`}>
              {lightPercentage > 50 ? 'POOR' : 'GOOD'}
            </span>
          </div>
          <div className="card-content">
            <div className="value">{sensorData.light.toFixed(0)}</div>
            <div className="percentage-bar">
              <div className="percentage-fill" style={{ width: `${lightPercentage}%` }}></div>
            </div>
            <div className="percentage">{lightPercentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="card temperature-card">
          <div className="card-header">
            <h2>🌡️ Temperature</h2>
            <span className={`status ${tempInfo.class}`}>
              {sensorData.dht_error ? 'ERROR' : tempInfo.status}
            </span>
          </div>
          <div className="card-content">
            <div className="value">{sensorData.temperature.toFixed(1)}°C</div>
            <div className="range-info">Ideal: 15°C - 30°C</div>
          </div>
        </div>

        <div className="card humidity-card">
          <div className="card-header">
            <h2>💦 Air Humidity</h2>
            <span className={`status ${humidityInfo.class}`}>
              {sensorData.dht_error ? 'ERROR' : humidityInfo.status}
            </span>
          </div>
          <div className="card-content">
            <div className="value">{sensorData.humidity.toFixed(1)}%</div>
            <div className="percentage-bar">
              <div className="percentage-fill" style={{ width: `${sensorData.humidity}%` }}></div>
            </div>
            <div className="range-info">Ideal: 30% - 70%</div>
          </div>
        </div>

        <div className="card water-card">
          <div className="card-header">
            <h2>🧴 Water Level</h2>
            <span className={`status ${sensorData.water_level < 200 ? 'low' : 'good'}`}>
              {sensorData.water_level < 200 ? 'LOW' : 'OK'}
            </span>
          </div>
          <div className="card-content">
            <div className="value">{sensorData.water_level.toFixed(0)} mL</div>
            <div className="percentage-bar">
              <div className="percentage-fill" style={{ width: `${waterPercentage}%` }}></div>
            </div>
            <div className="percentage">{waterPercentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="card pump-card">
          <div className="card-header">
            <h2>🚰 Water Pump</h2>
            <span className={`status ${sensorData.pump_active ? 'active' : 'inactive'}`}>
              {sensorData.pump_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="card-content">
            <div className={`pump-icon ${sensorData.pump_active ? 'active' : ''}`}>💦</div>
            <p>{sensorData.pump_active ? 'Watering plant...' : 'Pump is off'}</p>
          </div>
        </div>

        <div className="card system-card">
          <div className="card-header">
            <h2>⚙️ System Status</h2>
          </div>
          <div className="card-content">
            <div className="status-item">
              <span className="label">WiFi Signal:</span>
              <span className="value">{sensorData.wifi_strength} dBm ({wifiInfo.quality})</span>
            </div>
            <div className="status-item">
              <span className="label">DHT Sensor:</span>
              <span className={`value ${sensorData.dht_error ? 'error' : 'good'}`}>
                {sensorData.dht_error ? `ERROR (${sensorData.dht_error_count})` : 'HEALTHY'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Last Update:</span>
              <span className="value">{getLastUpdateTime()}</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Dashboard updated: {lastUpdated.toLocaleTimeString()}</p>
      </footer>
    </div>
  )
}

export default App