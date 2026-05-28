import { StateCreator } from 'zustand';
import type {
  Project, Contact, VisitLog, Quote, Contract, Payment, Service, Task,
} from '../../types';
import {
  projectsApi, contactsApi, visitLogsApi,
  quotesApi, contractsApi, paymentsApi, servicesApi, tasksApi,
} from '../../api';

// ─── types ──────────────────────────────────────────────────────────────────────

/** 实体 API 适配器 */
interface EntityApi {
  create: (data: Record<string, unknown>) => Promise<{ data: any }>;
  update: (id: string, data: any) => Promise<{ data: any }>;
  delete: (id: string) => Promise<unknown>;
}

// ─── generic CRUD factory ──────────────────────────────────────────────────────

function createEntityCrud(
  key: string,
  api: EntityApi,
): (set: (partial: any) => void) => Record<string, (...args: any[]) => any> {
  return (set) => ({
    add: async (data) => {
      const res = await api.create(data);
      set((s: any) => ({ [key]: [...s[key], res.data] }));
      return res.data;
    },
    update: async (id, data) => {
      const res = await api.update(id, data);
      set((s: any) => ({ [key]: s[key].map((item: any) => (item.id === id ? res.data : item)) }));
    },
    remove: async (id) => {
      await api.delete(id);
      set((s: any) => ({ [key]: s[key].filter((item: any) => item.id !== id) }));
    },
  });
}

// ─── entity slice interface ─────────────────────────────────────────────────────

export interface EntitySlice {
  // data
  projects: Project[];
  contacts: Contact[];
  visitLogs: VisitLog[];
  quotes: Quote[];
  contracts: Contract[];
  payments: Payment[];
  services: Service[];
  tasks: Task[];

  // bootstrap
  isDataInitialized: boolean;
  fetchAll: () => Promise<void>;
  refetchAll: () => Promise<void>;

  // CRUD
  addProject: (data: Record<string, unknown>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addContact: (data: Record<string, unknown>) => Promise<Contact>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  addVisitLog: (data: Record<string, unknown>) => Promise<VisitLog>;
  updateVisitLog: (id: string, data: Partial<VisitLog>) => Promise<void>;
  deleteVisitLog: (id: string) => Promise<void>;

  addQuote: (data: Record<string, unknown>) => Promise<Quote>;
  updateQuote: (id: string, data: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  addContract: (data: Record<string, unknown>) => Promise<Contract>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;

  addPayment: (data: Record<string, unknown>) => Promise<Payment>;
  updatePayment: (id: string, data: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  addService: (data: Record<string, unknown>) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  addTask: (data: Record<string, unknown>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const ENTITIES = [
  { key: 'projects', api: projectsApi },
  { key: 'contacts', api: contactsApi },
  { key: 'visitLogs', api: visitLogsApi },
  { key: 'quotes', api: quotesApi },
  { key: 'contracts', api: contractsApi },
  { key: 'payments', api: paymentsApi },
  { key: 'services', api: servicesApi },
  { key: 'tasks', api: tasksApi },
] as const;

export const createEntitySlice: StateCreator<any, [], [], EntitySlice> = (set, get) => {
  // 为每个实体生成 CRUD 操作
  const entityCruds: Record<string, (...args: any[]) => any> = {};
  for (const { key, api } of ENTITIES) {
    // key 去尾 's' 得到单数 → addProject / addContact / ...
    const singular = key.endsWith('s') ? key.slice(0, -1) : key;
    const cap = singular.charAt(0).toUpperCase() + singular.slice(1);
    const crud = createEntityCrud(key as string, api as EntityApi)(set);
    entityCruds[`add${cap}`] = crud.add;
    entityCruds[`update${cap}`] = crud.update;
    entityCruds[`delete${cap}`] = crud.remove;
  }

  return {
    projects: [],
    contacts: [],
    visitLogs: [],
    quotes: [],
    contracts: [],
    payments: [],
    services: [],
    tasks: [],
    isDataInitialized: false,

    // ─── bootstrap ────────────────────────────────────────────────────────
    fetchAll: async () => {
      if (get().isDataInitialized) return;
      set({ loading: true, error: null });
      try {
        const opts = { page: 1, limit: 200 };
        const [p, c, v, q, ct, pay, svc, tsk] = await Promise.all([
          projectsApi.list(opts),
          contactsApi.list(opts),
          visitLogsApi.list(opts),
          quotesApi.list(opts),
          contractsApi.list(opts),
          paymentsApi.list(opts),
          servicesApi.list(opts),
          tasksApi.list(opts),
        ]);
        set({
          projects: p.data.items,
          contacts: c.data.items,
          visitLogs: v.data.items,
          quotes: q.data.items,
          contracts: ct.data.items,
          payments: pay.data.items,
          services: svc.data.items,
          tasks: tsk.data.items,
          isDataInitialized: true,
          loading: false,
        });
      } catch {
        set({ loading: false, error: '数据加载失败，请刷新重试' });
      }
    },

    refetchAll: async () => {
      set({ loading: true, error: null, isDataInitialized: false });
      try {
        const opts = { page: 1, limit: 200 };
        const [p, c, v, q, ct, pay, svc, tsk] = await Promise.all([
          projectsApi.list(opts),
          contactsApi.list(opts),
          visitLogsApi.list(opts),
          quotesApi.list(opts),
          contractsApi.list(opts),
          paymentsApi.list(opts),
          servicesApi.list(opts),
          tasksApi.list(opts),
        ]);
        set({
          projects: p.data.items,
          contacts: c.data.items,
          visitLogs: v.data.items,
          quotes: q.data.items,
          contracts: ct.data.items,
          payments: pay.data.items,
          services: svc.data.items,
          tasks: tsk.data.items,
          isDataInitialized: true,
          loading: false,
        });
      } catch {
        set({ loading: false, error: '数据加载失败，请刷新重试' });
      }
    },

    // ─── CRUD（通过工厂生成）───────────────────────────────────────────────
    ...entityCruds,
  } as EntitySlice;
};
