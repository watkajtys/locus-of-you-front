import Card from './Card';

const Stats = () => {
  const stats = [
    { label: 'Global Edge Locations', value: '300+', suffix: '' },
    { label: 'Response Time', value: '<50', suffix: 'ms' },
    { label: 'Uptime', value: '99.9', suffix: '%' },
    { label: 'Requests per Second', value: '10M', suffix: '+' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 text-center">
          <div className="space-y-2">
            <div 
              className="text-3xl font-bold"
              style={{ color: 'var(--color-accent)' }}
            >
              {stat.value}{stat.suffix}
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: 'var(--color-muted)' }}
            >
              {stat.label}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Stats;