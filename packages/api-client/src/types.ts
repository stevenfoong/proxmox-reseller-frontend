/** Virtual machine types */
export interface VirtualMachine {
  id: string;
  vmId: number;
  name: string;
  tenantId: string;
  nodeId: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  type: 'qemu' | 'lxc';
  config: {
    cores: number;
    memory: number;
    disk: number;
    os: string;
    template: string;
    sshKeys?: string[];
    cloudInitUser?: string;
  };
  ipAddresses: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVmRequest {
  name: string;
  type: 'qemu' | 'lxc';
  nodeId: string;
  config: {
    cores: number;
    memory: number;
    disk: number;
    template: string;
    sshKeys?: string[];
    cloudInitUser?: string;
  };
}

/** Billing types */
export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  pricing: {
    cpuPerCore: number;
    memoryPerGib: number;
    storagePerGib: number;
    networkPerGib: number;
  };
  limits: {
    maxVMs: number;
    maxCores: number;
    maxMemoryGib: number;
    maxStorageGib: number;
  };
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  period: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue';
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
}

/** User types */
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  tenantId: string;
  planId: string;
  oidcSub: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/** Monitoring types */
export interface NodeMetrics {
  nodeId: string;
  cpu: number;
  memory: { used: number; total: number };
  disk: { used: number; total: number };
  network: { in: number; out: number };
  timestamp: string;
}

export interface VmMetrics {
  vmId: string;
  cpu: number;
  memory: { used: number; total: number };
  disk: { read: number; write: number };
  network: { in: number; out: number };
  timestamp: string;
}
