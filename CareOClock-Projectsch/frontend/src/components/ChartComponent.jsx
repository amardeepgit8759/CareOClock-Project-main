// frontend/src/components/ChartComponent.jsx
import React from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const ChartComponent = ({
    type = 'line',
    data = [],
    title = '',
    xAxisKey = 'date',
    yAxisKey = 'value',
    color = '#3B82F6',
    height = 300,
    showGrid = true,
    showTooltip = true,
    showLegend = false
}) => {
    // Custom tooltip for elderly-friendly display
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                    <p className="text-elderly-base font-medium text-gray-800">
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-elderly-base" style={{ color: entry.color }}>
                            {`${entry.name || entry.dataKey}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Color schemes for different chart types
    const colors = {
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        purple: '#8B5CF6',
        teal: '#14B8A6',
        indigo: '#6366F1',
        pink: '#EC4899'
    };

    const pieColors = [colors.primary, colors.success, colors.warning, colors.danger, colors.purple];

    const renderMultipleLines = () => {
        if (!Array.isArray(yAxisKey)) return null;
        return yAxisKey.map((key, index) => (
            <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index] || color}
                strokeWidth={3}
                dot={{ fill: colors[index] || color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[index] || color, strokeWidth: 2 }}
            />
        ));
    };

    const renderChart = () => {
        switch (type) {
            case 'line':
                if (Array.isArray(yAxisKey)) {
                    return (
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                            <XAxis dataKey={xAxisKey} tick={{ fontSize: 14, fill: '#6B7280' }} tickLine={{ stroke: '#9CA3AF' }} />
                            <YAxis tick={{ fontSize: 14, fill: '#6B7280' }} tickLine={{ stroke: '#9CA3AF' }} />
                            {showTooltip && <Tooltip content={<CustomTooltip />} />}
                            {showLegend && <Legend wrapperStyle={{ fontSize: '14px' }} />}
                            {renderMultipleLines()}
                        </LineChart>
                    );
                }
                return (
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                        <XAxis dataKey={xAxisKey} tick={{ fontSize: 14, fill: '#6B7280' }} tickLine={{ stroke: '#9CA3AF' }} />
                        <YAxis tick={{ fontSize: 14, fill: '#6B7280' }} tickLine={{ stroke: '#9CA3AF' }} />
                        {showTooltip && <Tooltip content={<CustomTooltip />} />}
                        {showLegend && <Legend wrapperStyle={{ fontSize: '14px' }} />}
                        <Line
                            type="monotone"
                            dataKey={yAxisKey}
                            stroke={color}
                            strokeWidth={3}
                            dot={{ fill: color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                        />
                    </LineChart>
                );

            case 'area':
                const renderMultipleAreas = () => {
                    if (!Array.isArray(yAxisKey)) return null;
                    return yAxisKey.map((key, index) => (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index] || color}
                            fillOpacity={0.6}
                            fill={colors[index] || color}
                        />
                    ));
                };

                if (Array.isArray(yAxisKey)) {
                    return (
                        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                            <XAxis dataKey={xAxisKey} tick={{ fontSize: 14, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 14, fill: '#6B7280' }} />
                            {showTooltip && <Tooltip content={<CustomTooltip />} />}
                            {showLegend && <Legend wrapperStyle={{ fontSize: '14px' }} />}
                            {renderMultipleAreas()}
                        </AreaChart>
                    );
                }
                return (
                    <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                        <XAxis dataKey={xAxisKey} tick={{ fontSize: 14, fill: '#6B7280' }} />
                        <YAxis tick={{ fontSize: 14, fill: '#6B7280' }} />
                        {showTooltip && <Tooltip content={<CustomTooltip />} />}
                        {showLegend && <Legend wrapperStyle={{ fontSize: '14px' }} />}
                        <Area
                            type="monotone"
                            dataKey={yAxisKey}
                            stroke={color}
                            fillOpacity={0.6}
                            fill={color}
                        />
                    </AreaChart>
                );

            case 'bar':
                return (
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                        <XAxis
                            dataKey={xAxisKey}
                            tick={{ fontSize: 14, fill: '#6B7280' }}
                        />
                        <YAxis
                            tick={{ fontSize: 14, fill: '#6B7280' }}
                        />
                        {showTooltip && <Tooltip content={<CustomTooltip />} />}
                        {showLegend && <Legend wrapperStyle={{ fontSize: '14px' }} />}
                        <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                );

            case 'pie':
                return (
                    <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey={yAxisKey}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                        </Pie>
                        {showTooltip && <Tooltip content={<CustomTooltip />} />}
                    </PieChart>
                );

            default:
                return <div className="text-elderly-base text-gray-500">Unsupported chart type</div>;
        }
    };

    return (
        <div className="card-elderly" style={{ position: 'relative' }}>
            {title && (
                <h3 className="text-elderly-lg font-semibold text-gray-800 mb-4">
                    {title}
                </h3>
            )}
            {data.length > 0 ? (
                <div style={{ width: '100%', height: height }}>
                    <ResponsiveContainer>
                        {renderChart()}
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p className="text-elderly-base text-gray-500">
                            No data available to display
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

};

export default ChartComponent;
