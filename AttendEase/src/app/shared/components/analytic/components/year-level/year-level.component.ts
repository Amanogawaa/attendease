import { Component, OnInit } from '@angular/core';
import { DataAnalyticsService } from '../../../../../core/service/data-analytics.service';
import { ChartModule } from 'primeng/chart';
import { TooltipItem } from 'chart.js';

@Component({
  selector: 'app-year-level',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './year-level.component.html',
  styleUrl: './year-level.component.css',
})
export class YearLevelComponent implements OnInit {
  data: any;
  basicOptions: any;

  constructor(private dataService: DataAnalyticsService) {}

  ngOnInit(): void {
    this.dataService.getYearLevel().subscribe((res) => {
      this.processChartData(res.payload);
    });

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');

    this.basicOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
        tooltip: {
          callbacks: {
            title: () => '', // Remove the default title
            label: (context: TooltipItem<'bar'>) => {
              // Specify the type for context
              const label = context.label || '';
              const value = (context.raw as number) || 0; // Ensure context.raw is treated as a number
              return `Block: ${label}`;
            },
          },
        },
      },
    };
  }

  processChartData(payload: any[]) {
    const documentStyle = getComputedStyle(document.documentElement);

    const labels = payload.map((item) => item.year_level);
    const data = payload.map((item) => item.student_count);

    this.data = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            documentStyle.getPropertyValue('--blue-500'),
            documentStyle.getPropertyValue('--yellow-500'),
            documentStyle.getPropertyValue('--green-500'),
            documentStyle.getPropertyValue('--orange-500'),
          ],
          hoverBackgroundColor: [
            documentStyle.getPropertyValue('--blue-400'),
            documentStyle.getPropertyValue('--yellow-400'),
            documentStyle.getPropertyValue('--green-400'),
            documentStyle.getPropertyValue('--orange-400'),
          ],
        },
      ],
    };
  }
}
