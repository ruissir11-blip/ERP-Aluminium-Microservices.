// Aluminum module types

export enum ProfileType {
  PLAT = 'PLAT',
  TUBE = 'TUBE',
  CORNIERE = 'CORNIERE',
  UPN = 'UPN',
  IPE = 'IPE',
  CUSTOM = 'CUSTOM',
}

export interface AluminumProfile {
  id: string;
  reference: string;
  name: string;
  type: ProfileType;
  length?: number;
  width?: number;
  thickness?: number;
  unitPrice: number;
  weightPerMeter?: number;
  density: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  billingStreet?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  paymentTerms?: string;
  vatNumber?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type QuoteStatus = 
  | 'BROUILLON' 
  | 'ENVOYÉ' 
  | 'ACCEPTÉ' 
  | 'REFUSÉ' 
  | 'EXPIRÉ' 
  | 'ANNULÉ' 
  | 'ARCHIVÉ';

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customer?: Customer;
  status: QuoteStatus;
  subtotal: number;
  total: number;
  validUntil: string;
  createdAt: string;
  lines?: QuoteLine[];
}

export interface QuoteLine {
  id: string;
  profileId: string;
  profile?: AluminumProfile;
  quantity: number;
  unitLength: number;
  totalWeight: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CalculationResult {
  weight: number;
  surface: number;
  materialCost: number;
}

export type OrderStatus = 
  | 'EN_ATTENTE' 
  | 'CONFIRMÉE' 
  | 'EN_PRODUCTION' 
  | 'PARTIELLE' 
  | 'TERMINÉE' 
  | 'LIVRÉE' 
  | 'FACTURÉE' 
  | 'ANNULÉE';

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  quoteId?: string;
  quote?: Quote;
  customerId: string;
  customer?: Customer;
  status: OrderStatus;
  total: number;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 
  | 'BROUILLON' 
  | 'VALIDÉE' 
  | 'ENVOYÉE' 
  | 'PAYÉE' 
  | 'EN_RETARD' 
  | 'ANNULÉE';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  order?: CustomerOrder;
  customerId: string;
  customer?: Customer;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  paymentReference?: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
