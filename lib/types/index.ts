



export type UserRole =
  | "member"
  | "investor"
  | "president"
  | "treasurer"
  | "secretary"
  | "boardMember";

export interface CampusUser {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  nationalID: string;
  createdAt: Date | string;
  
  totalShareValue: number;    
  paidSoFar: number;          
  emergencyTaken: number;     
  interestOwed: number;       
  shortfallPenaltyOwed?: number; 
  penalizedYears?: number[];   
  accountUsedWhileSaving?: string; 
  isActive: boolean;
  passwordChanged: boolean;   
  documentsUploaded: boolean;
}

export interface Payment {
  id: string;
  amount: number;             
  date: string;               
  year: number;               
  provider?: "MTN" | "Airtel";
  note?: string;
}

export interface UserDocument {
  id: string;
  type: "ID" | "Agreement" | "Application";
  url: string;
  uploadedAt: string;
}

export interface EmergencyRequest {
  id: string;
  userId: string;
  userName?: string;          
  amount: number;             
  requestedAt: string;
  dueDate: string;            
  status: "pending" | "approved" | "rejected" | "disbursed" | "paid";
  approvedBy?: string;
  rejectionReason?: string;
  interestRate: number;       
  interestAmount: number;     
  note?: string;              
  penaltyApplied?: boolean;   
}

export interface ShareListing {
  id: string;
  sellerId: string;
  sellerName: string;
  totalShares: number;        
  availableShares: number;    
  pricePerShare: number;      
  isLiquidation: boolean;     
  status: 'open' | 'closed' | 'cancelled';
  createdAt: string;
}

export interface ShareOffer {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  requestedShares: number;
  pricePerShare: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface ProposalComment {
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: 'investment' | 'policy' | 'infrastructure' | 'other';
  status: 'pending' | 'active' | 'approved' | 'rejected' | 'expired' | 'under_review';
  proposedBy: string;
  proposedByName: string;
  proposedAt: string;
  createdAt: string;
  expiresAt: string;
  votes: {
    yes: number;
    no: number;
    totalVoters: number;
    voters: Record<string, "yes" | "no">;  
  };
  requiredPercentage: number; 
  comments: ProposalComment[];
  attachmentUrl?: string;     
}

export interface Meeting {
  id: string;
  title: string;
  date: string;               
  status: "planned" | "ongoing" | "completed" | "expired";
  agenda: string;
  minutes: string;            
  createdBy: string;
  attendees: string[];        
  invitedRoles: UserRole[];   
  durationHours: number;      
}

export interface MeetingComment {
  id: string;
  uid: string;
  name: string;
  role: UserRole;
  text: string;
  createdAt: string;          
}

export interface CampusInfo {
  id: string;
  title: string;
  content: string;
  category: 'announcement' | 'update' | 'event' | 'policy' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  views: number;
  attachments?: string[];
}

export interface VoteRecord {
  id: string;
  userId: string;
  proposalId: string;
  vote: 'for' | 'against';
  votedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type:
  | "payment"
  | "emergency_request"
  | "emergency_approved"
  | "emergency_rejected"
  | "proposal_new"
  | "proposal_vote"
  | "proposal_approved"
  | "meeting_invite"
  | "certificate_ready"
  | "dividend_distributed"
  | "general";
}

export interface DividendProject {
  id: string;
  name: string;
  description: string;
  totalInvestment: number;
  totalIncome: number;
  profit: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'pending';
  category: 'agriculture' | 'real_estate' | 'business' | 'infrastructure' | 'other';
  createdBy: string; 
  createdAt: string;
  updatedAt: string;
}

export interface DividendDistribution {
  id: string;
  projectId: string;
  userId: string;
  sharesOwned: number;
  dividendAmount: number;
  perShareAmount: number;
  distributionDate: string;
  status: 'pending' | 'distributed' | 'claimed';
  claimedAt?: string;
}

export interface UserDividendSummary {
  totalDividends: number;
  claimedDividends: number;
  pendingDividends: number;
  projects: Array<{
    projectId: string;
    projectName: string;
    dividendAmount: number;
    status: 'pending' | 'distributed' | 'claimed';
    distributionDate: string;
  }>;
}


export const BUSINESS_RULES = {
  MIN_SHARE_VALUE: 400_000,       
  SHARE_UNIT_PRICE: 1_000,        
  MIN_SHARES: 400,
  PAYMENT_YEARS: 5,
  ANNUAL_TARGET_PERCENT: 0.20,    
  EMERGENCY_MAX_PERCENT: 0.40,    
  EMERGENCY_INTEREST_RATE: 0.05,  
  ANNUAL_SHORTFALL_PENALTY_RATE: 0.50, 
  DEFAULT_PASSWORD: "CampusLink2025",
} as const;


export function getAnnualTarget(totalShareValue: number): number {
  return totalShareValue * BUSINESS_RULES.ANNUAL_TARGET_PERCENT;
}

export function getMaxEmergencyCash(paidSoFar: number): number {
  return paidSoFar * BUSINESS_RULES.EMERGENCY_MAX_PERCENT;
}

export function getInterestAmount(emergencyAmount: number): number {
  return emergencyAmount * BUSINESS_RULES.EMERGENCY_INTEREST_RATE;
}

export function getShareCount(totalShareValue: number): number {
  return totalShareValue / BUSINESS_RULES.SHARE_UNIT_PRICE;
}

export function getProgressPercent(paidSoFar: number, totalShareValue: number): number {
  return Math.min((paidSoFar / totalShareValue) * 100, 100);
}

export function getYearlyProgressPercent(paidThisYear: number, annualTarget: number): number {
  return Math.min((paidThisYear / annualTarget) * 100, 100);
}

export function isPaymentComplete(paidSoFar: number, totalShareValue: number): boolean {
  return paidSoFar >= totalShareValue;
}


export interface YearlyPayment {
  year: number;
  target: number;
  paid: number;
  excess: number;
  isCompleted: boolean;
  isCurrent: boolean;
}

export function calculateYearlyPayments(
  payments: Array<{ amount: number; year: number }>,
  totalShareValue: number,
  startYear: number
): YearlyPayment[] {
  const annualTarget = getAnnualTarget(totalShareValue);
  const years: YearlyPayment[] = [];
  
  
  for (let i = 0; i < BUSINESS_RULES.PAYMENT_YEARS; i++) {
    const year = startYear + i;
    years.push({
      year,
      target: annualTarget,
      paid: 0,
      excess: 0,
      isCompleted: false,
      isCurrent: year === new Date().getFullYear()
    });
  }
  
  
  const paidByYear = new Map<number, number>();
  payments.forEach(payment => {
    const current = paidByYear.get(payment.year) || 0;
    paidByYear.set(payment.year, current + payment.amount);
  });
  
  
  let remainingExcess = 0;
  
  for (let i = 0; i < years.length; i++) {
    const yearData = years[i];
    const paidThisYear = (paidByYear.get(yearData.year) || 0) + remainingExcess;
    
    yearData.paid = Math.min(paidThisYear, yearData.target);
    yearData.excess = Math.max(0, paidThisYear - yearData.target);
    yearData.isCompleted = yearData.paid >= yearData.target;
    
    
    remainingExcess = yearData.excess;
  }
  
  return years;
}

export function formatRF(amount: number): string {
  return new Intl.NumberFormat("rw-RW", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + " RF";
}

export interface DraftTodo {
  id: string;
  task: string;
  completed: boolean;
}

export interface ProjectDraft {
  id: string;
  title: string;
  description: string;
  category: Proposal['category'];
  status: 'draft' | 'submitted' | 'under_review' | 'feedback_given';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  todos: DraftTodo[];
  comments: ProposalComment[];
}
