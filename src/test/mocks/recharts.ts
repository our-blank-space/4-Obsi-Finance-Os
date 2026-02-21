import React from 'react';
// Mocks expansivos para cubrir todos los gráficos usados
export const ResponsiveContainer = ({ children }: any) => React.createElement('div', { className: "recharts-responsive-container" }, children);
export const AreaChart = ({ children }: any) => React.createElement('div', { className: "recharts-area-chart" }, children);
export const BarChart = ({ children }: any) => React.createElement('div', { className: "recharts-bar-chart" }, children);
export const PieChart = ({ children }: any) => React.createElement('div', { className: "recharts-pie-chart" }, children);
export const RadialBarChart = ({ children }: any) => React.createElement('div', { className: "recharts-radial-bar-chart" }, children);

export const Area = () => null;
export const Bar = () => null;
export const Pie = () => null;
export const RadialBar = () => null;
export const Cell = () => null;
export const Legend = () => null;
export const XAxis = () => null;
export const YAxis = () => null;
export const CartesianGrid = () => null;
export const Tooltip = () => null;
export const PolarAngleAxis = () => null;