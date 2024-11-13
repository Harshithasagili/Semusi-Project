import React, { useState, useEffect } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

// Register necessary chart components
ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const TemperatureChart = () => {
    const [scatterData, setScatterData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date
    const [ambientTemperature, setAmbientTemperature] = useState(null); // State to store ambient temperature

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
        setScatterData([]); // Clear existing data for the new date
        setAmbientTemperature(null); // Reset ambient temperature
        fetchTemperatureData(event.target.value); // Fetch data for the selected date
    };

    const fetchTemperatureData = async (date) => {
        try {
            const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&date=${date}&hourly=temperature_2m&appid=${process.env.REACT_APP_WEATHER_API_KEY}`);
            const hourlyTemps = response.data.hourly.temperature_2m; // Assume this endpoint provides hourly data for the day

            // Generate data points for scatter plot and calculate ambient temperature
            let totalWeightedTemp = 0;
            let totalWeight = 0;

            const newData = hourlyTemps.map(temp => {
                const batteryTemperature = Math.random() * (35 - 25) + 25; // Simulated battery temperature
                const weight = 1 / Math.abs(batteryTemperature - temp + 0.1); // Weight inversely proportional to difference

                // Weighted calculation for ambient temperature
                totalWeightedTemp += temp * weight;
                totalWeight += weight;

                return { x: temp, y: batteryTemperature };
            });

            setScatterData(newData);

            // Calculate and set ambient temperature based on weighted average
            const avgAmbientTemp = totalWeightedTemp / totalWeight;
            setAmbientTemperature(avgAmbientTemp);
        } catch (error) {
            console.error("Error fetching temperature data:", error);
        }
    };

    useEffect(() => {
        fetchTemperatureData(selectedDate);
    }, [selectedDate]);

    const data = {
        datasets: [
            {
                label: 'Local Temperature vs. Battery Temperature',
                data: scatterData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // Light blue for data points
                borderColor: 'rgba(54, 162, 235, 1)', // Darker blue outline
                pointBackgroundColor: 'rgba(255, 99, 132, 0.8)', // Pinkish-red for points
                pointBorderColor: 'rgba(255, 99, 132, 1)', // Darker red border
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    };

    return (
        <div>
            
            <label>Select Date: </label>
            <input type="date" value={selectedDate} onChange={handleDateChange} />
            <h3>Temperature Scatter Plot</h3>
            {scatterData.length > 0 ? (
                <Scatter
                    data={data}
                    options={{
                        scales: {
                            x: { title: { display: true, text: 'Local Temperature (°C)', color: '#36A2EB' } },
                            y: { title: { display: true, text: 'Battery Temperature (°C)', color: '#FF6384' } },
                        },
                        plugins: {
                            legend: {
                                labels: {
                                    color: '#444', // Dark color for legend text
                                },
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0,0,0,0.8)', // Dark background for tooltip
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                            },
                        },
                    }}
                />
            ) : (
                <p>Loading data for {selectedDate}...</p>
            )}
            {ambientTemperature !== null && (
                <div>
                    <h3>Calculated Ambient Temperature:</h3>
                    <p style={{ color: '#36A2EB' }}>
                        The ambient temperature for {selectedDate} is approximately {ambientTemperature.toFixed(2)} °C.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TemperatureChart;


