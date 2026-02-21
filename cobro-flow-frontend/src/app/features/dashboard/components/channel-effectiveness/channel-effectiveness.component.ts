import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ChannelEffectiveness } from '../../models/dashboard.models';

@Component({
  selector: 'app-channel-effectiveness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="effectiveness-card">
      <div class="card-header">
        <div class="title-row">
          <i data-lucide="message-square" class="title-icon"></i>
          <h3 class="card-title">{{ title() }}</h3>
        </div>
      </div>

      <div class="chart-container">
        <div class="donut-chart">
          <svg viewBox="0 0 100 100" class="donut">
            @for (segment of chartSegments(); track segment.channel) {
              <circle
                class="donut-segment"
                [attr.stroke]="segment.color"
                [attr.stroke-dasharray]="segment.dashArray"
                [attr.stroke-dashoffset]="segment.dashOffset"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke-width="12"
              />
            }
          </svg>
          <div class="donut-center">
            <span class="donut-value">{{ totalValue() | number }}</span>
            <span class="donut-label">Total</span>
          </div>
        </div>

        <div class="channel-list">
          @for (channel of channelData(); track channel.channel) {
            <div class="channel-item">
              <div class="channel-info">
                <span class="channel-dot" [style.background-color]="channel.color"></span>
                <span class="channel-name">{{ channel.channel }}</span>
              </div>
              <span class="channel-percentage">{{ channel.percentage }}%</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .effectiveness-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-icon {
      width: 18px;
      height: 18px;
      color: #1F2937;
    }

    .card-title {
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .donut-chart {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto;
    }

    .donut {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .donut-segment {
      transition: stroke-dasharray 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .donut-value {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #1F2937;
    }

    .donut-label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: #6B7280;
    }

    .channel-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .channel-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.15s ease;
      padding: 4px 8px;
      margin: -4px -8px;
      border-radius: 6px;

      &:hover {
        background: #F9FAFB;
      }
    }

    .channel-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .channel-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .channel-name {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #1F2937;
    }

    .channel-percentage {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: #1F2937;
    }
  `]
})
export class ChannelEffectivenessComponent {
  title = input<string>('Efectividad por Canal');
  channelData = input.required<ChannelEffectiveness[]>();

  totalValue = computed(() => {
    return this.channelData().reduce((acc, item) => acc + item.value, 0);
  });

  chartSegments = computed(() => {
    const circumference = 2 * Math.PI * 40;
    let accumulatedOffset = 0;

    return this.channelData().map((item) => {
      const segmentLength = (item.percentage / 100) * circumference;
      const dashOffset = circumference - accumulatedOffset;
      accumulatedOffset += segmentLength;

      return {
        ...item,
        dashArray: `${segmentLength} ${circumference - segmentLength}`,
        dashOffset: dashOffset
      };
    });
  });
}
