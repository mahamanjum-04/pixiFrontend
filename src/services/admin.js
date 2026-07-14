import api from './api.js';

export const getUsers       = ()         => api.get('/api/admin/users/');
export const banUser        = (id)       => api.patch(`/api/admin/users/${id}/ban/`);
export const unbanUser      = (id)       => api.patch(`/api/admin/users/${id}/unban/`);
export const resolveReport  = (id, data) => api.patch(`/api/admin/reports/${id}/resolve/`, data);
export const submitReport   = (data)     => api.post('/api/admin/submit-report/', data);
export const getCreatorAnalytics = ()    => api.get('/api/reports/creator/');
export const getAdminAnalytics   = ()    => api.get('/api/reports/admin/');

export const getReports = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.sort) params.append('sort', filters.sort);
    const qs = params.toString();
    return api.get(`/api/admin/reports/${qs ? `?${qs}` : ''}`);
};

export const removeContent = (artworkId, reportId) =>
    api.delete(`/api/admin/content/${artworkId}/`, { data: { report_id: reportId } });

export const updateReportStatus = (reportId, newStatus) =>
    api.patch(`/api/admin/reports/${reportId}/status/`, { status: newStatus });

export const warnUser = (reportId, message) =>
    api.post(`/api/admin/reports/${reportId}/warn/`, { message });

export const escalateReport = (reportId) =>
    api.patch(`/api/admin/reports/${reportId}/escalate/`);