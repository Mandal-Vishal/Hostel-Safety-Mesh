export const mockAnalytics = {
  totalIncidents: 128,
  sosEvents: 23,
  avgResponse: '02:14',
  resolved: 116,
  incidentsByDay: [
    { day: 'Mon', count: 7 },
    { day: 'Tue', count: 10 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 9 },
    { day: 'Fri', count: 8 },
  ],
  incidentsByZone: [
    { zone: 'Block A', count: 11 },
    { zone: 'Block B', count: 6 },
    { zone: 'Block C', count: 4 },
  ],
  categories: [
    { name: 'Safety Concern', count: 32 },
    { name: 'Noise', count: 28 },
    { name: 'Medical', count: 18 },
    { name: 'Security', count: 15 },
    { name: 'Other', count: 7 },
  ],
}