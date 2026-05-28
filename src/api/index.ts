export { default as http } from './http';
export { authApi } from './auth';
export {
  projectsApi,
  contactsApi,
  visitLogsApi,
  quotesApi,
  contractsApi,
  paymentsApi,
  servicesApi,
  tasksApi,
  directCostsApi,
  profitsApi,
} from './resources';
export { backupApi } from './backup';
export { statsApi } from './stats';
export { notificationsApi } from './notifications';
export { searchApi } from './search';
export { auditApi } from './audit';
export { attachmentsApi } from './attachments';
export type { StatsSummary, MonthlyTrend } from './stats';
export type { PaginatedResponse, ListParams } from './resources';
export type { SearchResult, SearchResponse } from './search';
