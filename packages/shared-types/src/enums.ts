export enum UserRole {
  Admin = 'Admin',
  Sales = 'Sales',
  Warehouse = 'Warehouse',
  Accounts = 'Accounts',
}

export enum CustomerType {
  Retail = 'Retail',
  Wholesale = 'Wholesale',
  Distributor = 'Distributor',
}

export enum CustomerStatus {
  Lead = 'Lead',
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export enum StockReferenceType {
  MANUAL = 'MANUAL',
  CHALLAN = 'CHALLAN',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
}

export enum ChallanStatus {
  Draft = 'Draft',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
}
