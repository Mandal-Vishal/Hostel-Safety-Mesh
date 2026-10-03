export const mockAdminStats = {
  totalUsers: 1248,
  residents: 1120,
  wardens: 18,
  securityStaff: 32,
  activeDevices: 48,
  onlineDevices: 46,
  incidentsThisMonth: 127,
  sosEvents: 21,
}

export const mockUsers = [
  { id: 'U-001', name: 'Vishal Sharma', email: 'vishal@hostel.edu', role: 'resident', zone: 'Block A / 204' },
  { id: 'U-002', name: 'Priya Mehta', email: 'priya@hostel.edu', role: 'warden', zone: 'Block A' },
  { id: 'U-003', name: 'Rahul Verma', email: 'rahul@hostel.edu', role: 'security', zone: 'All Zones' },
  { id: 'U-004', name: 'Admin User', email: 'admin@hostel.edu', role: 'admin', zone: '—' },
]

export const mockZones = [
  { id: 'Z-001', name: 'Block A', floors: 4, residents: 320, devices: 16 },
  { id: 'Z-002', name: 'Block B', floors: 3, residents: 240, devices: 12 },
  { id: 'Z-003', name: 'Block C', floors: 3, residents: 220, devices: 10 },
]