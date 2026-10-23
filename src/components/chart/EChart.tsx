// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Lazy-loaded ECharts canvas (tree-shaken modules). Exposes getDataURL for watermarked PNG export.
import { BarChart, CandlestickChart, GraphChart, HeatmapChart, LineChart, ScatterChart } from 'echarts/charts';
import { DataZoomComponent, GraphicComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

echarts.use([LineChart, BarChart, CandlestickChart, HeatmapChart, GraphChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, VisualMapComponent, MarkLineComponent, GraphicComponent, CanvasRenderer]);

export type EChartHandle = { dataUrl: (bg: string) => string | undefined };

const EChart = forwardRef<EChartHandle, { option: Record<string, unknown>; height: number; ariaLabel: string; onClick?: (p: { name?: string; data?: unknown; dataType?: string }) => void }>(function EChart({ option, height, ariaLabel, onClick }, ref) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const c = echarts.init(el.current, undefined, { renderer: 'canvas' });
    chart.current = c;
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true });
  }, [option]);

  useEffect(() => {
    const c = chart.current;
    if (!c || !onClick) return;
    c.on('click', onClick as never);
    return () => {
      c.off('click');
    };
  }, [onClick]);

  useImperativeHandle(ref, () => ({ dataUrl: (bg: string) => chart.current?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: bg }) }), []);

  return <div ref={el} role="img" aria-label={ariaLabel} style={{ height, width: '100%' }} />;
});

export default EChart;
