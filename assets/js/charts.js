/* ===== DailyOS SVG Chart Functions ===== */

/**
 * Render a bar chart as SVG
 * @param {string} containerId - DOM element ID
 * @param {Array} data - Array of {label, value} objects
 * @param {Object} options - {width, height, barColor, labelColor, title}
 */
function renderBarChart(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 2rem"><div class="empty-state-sub">Aucune donnée disponible</div></div>';
    return;
  }

  const {
    width = container.clientWidth || 400,
    height = 200,
    barColor = 'var(--color-accent)',
    labelColor = 'var(--color-text-muted)',
    title = ''
  } = options;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min((chartW / data.length) * 0.7, 40);
  const gap = (chartW - barWidth * data.length) / (data.length + 1);

  let bars = '';
  let labels = '';

  data.forEach((d, i) => {
    const barH = (d.value / maxVal) * chartH;
    const x = padding.left + gap + i * (barWidth + gap);
    const y = padding.top + chartH - barH;

    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${barColor}" rx="3" opacity="0.85">
      <title>${escapeHtml(String(d.label))}: ${d.value}</title>
    </rect>`;

    labels += `<text x="${x + barWidth / 2}" y="${padding.top + chartH + 16}" text-anchor="middle" fill="${labelColor}" font-size="11">${escapeHtml(String(d.label))}</text>`;
  });

  // Y axis
  const yAxis = `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartH}" stroke="var(--color-border)" stroke-width="1"/>`;
  const xAxis = `<line x1="${padding.left}" y1="${padding.top + chartH}" x2="${padding.left + chartW}" y2="${padding.top + chartH}" stroke="var(--color-border)" stroke-width="1"/>`;

  // Y axis labels
  let yLabels = '';
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((maxVal / 4) * i);
    const yPos = padding.top + chartH - (chartH / 4) * i;
    yLabels += `<text x="${padding.left - 8}" y="${yPos + 4}" text-anchor="end" fill="${labelColor}" font-size="10">${val}</text>`;
    if (i > 0) {
      yLabels += `<line x1="${padding.left}" y1="${yPos}" x2="${padding.left + chartW}" y2="${yPos}" stroke="var(--color-border)" stroke-width="0.5" stroke-dasharray="3,3"/>`;
    }
  }

  const svg = `
    <div style="width:100%;overflow-x:auto">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="min-width:${Math.max(width, 250)}px" role="img" aria-label="${escapeHtml(title || 'Graphique à barres')}">
        ${title ? `<text x="${width / 2}" y="14" text-anchor="middle" fill="var(--color-text)" font-size="13" font-weight="600">${escapeHtml(title)}</text>` : ''}
        ${yAxis}
        ${xAxis}
        ${yLabels}
        ${bars}
        ${labels}
      </svg>
    </div>
  `;

  container.innerHTML = svg;
}

/**
 * Render a line chart as SVG
 * @param {string} containerId - DOM element ID
 * @param {Array} data - Array of {label, value} objects
 * @param {Object} options - {width, height, lineColor, fillColor, labelColor, title}
 */
function renderLineChart(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 2rem"><div class="empty-state-sub">Aucune donnée disponible</div></div>';
    return;
  }

  const {
    width = container.clientWidth || 400,
    height = 200,
    lineColor = 'var(--color-accent)',
    fillColor = 'rgba(91, 141, 238, 0.1)',
    labelColor = 'var(--color-text-muted)',
    title = ''
  } = options;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartW;
    const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
    return { x, y, label: d.label, value: d.value };
  });

  // Build line path
  let linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  let fillPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  let dots = '';
  let labels = '';

  points.forEach((p, i) => {
    dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${lineColor}" stroke="var(--color-bg)" stroke-width="2">
      <title>${escapeHtml(String(p.label))}: ${p.value}</title>
    </circle>`;

    // Only show every Nth label if too many
    if (data.length <= 14 || i % Math.ceil(data.length / 10) === 0 || i === data.length - 1) {
      labels += `<text x="${p.x.toFixed(1)}" y="${padding.top + chartH + 16}" text-anchor="end" fill="${labelColor}" font-size="10" transform="rotate(-30 ${p.x.toFixed(1)} ${padding.top + chartH + 16})">${escapeHtml(String(p.label))}</text>`;
    }
  });

  // Y axis labels
  let yLabels = '';
  for (let i = 0; i <= 4; i++) {
    const val = minVal + (range / 4) * i;
    const yPos = padding.top + chartH - (chartH / 4) * i;
    yLabels += `<text x="${padding.left - 8}" y="${yPos + 4}" text-anchor="end" fill="${labelColor}" font-size="10">${Math.round(val * 10) / 10}</text>`;
    if (i > 0) {
      yLabels += `<line x1="${padding.left}" y1="${yPos}" x2="${padding.left + chartW}" y2="${yPos}" stroke="var(--color-border)" stroke-width="0.5" stroke-dasharray="3,3"/>`;
    }
  }

  const svg = `
    <div style="width:100%;overflow-x:auto">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="min-width:${Math.max(width, 250)}px" role="img" aria-label="${escapeHtml(title || 'Graphique linéaire')}">
        ${title ? `<text x="${width / 2}" y="14" text-anchor="middle" fill="var(--color-text)" font-size="13" font-weight="600">${escapeHtml(title)}</text>` : ''}
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartH}" stroke="var(--color-border)" stroke-width="1"/>
        <line x1="${padding.left}" y1="${padding.top + chartH}" x2="${padding.left + chartW}" y2="${padding.top + chartH}" stroke="var(--color-border)" stroke-width="1"/>
        ${yLabels}
        <path d="${fillPath}" fill="${fillColor}" opacity="0.5"/>
        <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linejoin="round"/>
        ${dots}
        ${labels}
      </svg>
    </div>
  `;

  container.innerHTML = svg;
}

/**
 * Render a mood meter (1-5 score) as SVG
 * @param {string} containerId - DOM element ID
 * @param {number} score - 1 to 5, or null
 */
function renderMoodMeter(containerId, score) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (score == null) {
    container.innerHTML = `<div class="score-value" style="color:var(--color-text-muted);font-size:1.5rem">—</div>`;
    return;
  }

  const clampedScore = Math.max(1, Math.min(5, Math.round(score)));
  const colors = ['#f87171', '#fb923c', '#fbbf24', '#86efac', '#4ade80'];
  const labels = ['Terrible', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];
  const emojis = ['😞', '😟', '😐', '🙂', '😄'];

  const color = colors[clampedScore - 1];
  const label = labels[clampedScore - 1];
  const emoji = emojis[clampedScore - 1];

  // Draw 5 circles, filled up to the score
  const size = 120;
  const radius = 10;
  const totalWidth = 5 * radius * 2 + 4 * 6;
  const startX = (size - totalWidth) / 2 + radius;

  let circles = '';
  const faceRadius = 28;
  const cx = size / 2;
  const cy = 38;

  for (let i = 0; i < 5; i++) {
    const x = startX + i * (radius * 2 + 6);
    const isFilled = i < clampedScore;
    circles += `<circle cx="${x}" cy="${cy}" r="${radius}" fill="${isFilled ? color : 'var(--color-card-hover)'}" stroke="${isFilled ? color : 'var(--color-border)'}" stroke-width="1.5"/>`;
  }

  const svg = `
    <div style="text-align:center">
      <svg width="${size}" height="90" viewBox="0 0 ${size} 90" role="img" aria-label="Humeur: ${label}">
        ${circles}
      </svg>
      <div style="margin-top:-4px">
        <span style="font-size:1.5rem">${emoji}</span>
        <span style="display:block;font-size:var(--font-size-sm);color:${color};font-weight:var(--font-weight-medium)">${label}</span>
      </div>
    </div>
  `;

  container.innerHTML = svg;
}
