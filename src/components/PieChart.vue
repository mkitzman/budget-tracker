<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  labels: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  colors: { type: Array, default: () => [] },
  title: { type: String, default: '' }
})

const defaultColors = [
  '#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2',
  '#64d2ff', '#ffd60a', '#ff6482', '#ac8e68', '#5e5ce6'
]

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    data: props.data,
    backgroundColor: props.colors.length ? props.colors : defaultColors.slice(0, props.data.length),
    borderWidth: 0,
    hoverBorderWidth: 2,
    hoverBorderColor: '#fff'
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 12,
        usePointStyle: true,
        pointStyle: 'circle',
        font: { size: 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(28, 28, 30, 0.95)',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 13 },
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => ` ${ctx.label}: $${ctx.parsed.toFixed(2)}`
      }
    }
  }
}

const hasData = computed(() => props.data.some(v => v > 0))
</script>

<template>
  <div class="pie-chart-wrapper card">
    <h3 class="mb-8">{{ title }}</h3>
    <Doughnut v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="empty-chart">
      <p class="text-secondary text-sm">No data yet</p>
    </div>
  </div>
</template>

<style scoped>
.pie-chart-wrapper {
  display: flex;
  flex-direction: column;
}

.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
