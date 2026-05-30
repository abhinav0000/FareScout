import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ForecastResult } from "../domain/types.js";
import { formatRupees } from "../domain/normalize.js";

const width = 900;
const height = 480;

export async function renderForecastChart(forecast: ForecastResult): Promise<Buffer> {
  const canvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "white"
  });

  return canvas.renderToBuffer({
    type: "line",
    data: {
      labels: forecast.points.map((point) => point.label),
      datasets: [
        {
          label: "Predicted fare",
          data: forecast.points.map((point) => Math.round(point.farePaise / 100)),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: "#1d4ed8"
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: `Fare forecast: current ${formatRupees(forecast.currentFarePaise)}, predicted low ${formatRupees(forecast.predictedLowestFarePaise)}`,
          color: "#111827",
          font: {
            size: 22,
            weight: "bold"
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => `₹${value}`
          },
          grid: {
            color: "#e5e7eb"
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}
