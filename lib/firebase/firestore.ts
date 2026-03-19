/**
 * Firestore helper functions for CampusLink Investment
 */
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, orderBy, getDocs, onSnapshot,
  serverTimestamp, Timestamp, increment, arrayUnion, writeBatch,
  deleteField, runTransaction, collectionGroup, limit,
} from "firebase/firestore";
import { db } from "./config";
import type {
  CampusUser, Payment, EmergencyRequest, Proposal,
  Meeting, MeetingComment, Notification, UserDocument, DividendProject, DividendDistribution, UserDividendSummary, CampusInfo, VoteRecord,
  ProjectDraft, UserRole, ProposalComment, ShareListing, ShareOffer
} from "@/lib/types";
import { getInterestAmount, getShareCount, calculateYearlyPayments } from "@/lib/types";
import { formatRF } from "@/lib/utils/format";

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<CampusUser | null> {
  const cacheKey = `user_${uid}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  const data = { uid: userDoc.id, ...userDoc.data() } as CampusUser;
  setCache(cacheKey, data);
  return data;
}

export async function getAllUsers(): Promise<CampusUser[]> {
  const cacheKey = "all_users";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const snap = await getDocs(
    query(collection(db, "users"), orderBy("totalShareValue", "desc"))
  );
  const data = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as CampusUser));
  setCache(cacheKey, data);
  return data;
}

export async function searchUserByNationalID(nationalID: string): Promise<CampusUser | null> {
  const q = query(collection(db, "users"), where("nationalID", "==", nationalID));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() } as CampusUser;
}

export async function updateUser(uid: string, data: Partial<CampusUser>) {
  const res = await updateDoc(doc(db, "users", uid), data);
  clearCache("user");
  return res;
}

// ── Payments ─────────────────────────────────────────────────────────────────

export async function addPayment(uid: string, payment: Omit<Payment, "id">) {
  const ref = await addDoc(collection(db, "users", uid, "payments"), payment);
  await updateDoc(doc(db, "users", uid), {
    paidSoFar: increment(payment.amount),
  });
  clearCache(`payments_${uid}`);
  clearCache("all_users");
  return ref.id;
}

export async function getUserPayments(uid: string): Promise<Payment[]> {
  const cacheKey = `payments_${uid}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const snap = await getDocs(
    query(collection(db, "users", uid, "payments"), orderBy("date", "desc"))
  );
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
  setCache(cacheKey, data);
  return data;
}

// ── Emergency Requests ───────────────────────────────────────────────────────

export async function createEmergencyRequest(
  uid: string,
  userName: string,
  amount: number,
  reason?: string
): Promise<string> {
  const interestAmount = getInterestAmount(amount);
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setMonth(now.getMonth() + 3);

  const data: Omit<EmergencyRequest, "id"> = {
    userId: uid,
    userName,
    amount,
    requestedAt: now.toISOString(),
    dueDate: dueDate.toISOString(),
    status: "pending",
    interestRate: 0.05,
    interestAmount,
    note: reason,
  };
  const ref = await addDoc(collection(db, "users", uid, "emergencyRequests"), data);
  clearCache(`emergencies_${uid}`);
  
  // Trigger: Notify Admins of new request
  await notifyAdmins(
    "New Emergency Request",
    `${userName} has requested ${formatRF(amount)}.`,
    "emergency_request"
  );

  return ref.id;
}

export async function approveEmergencyRequest(
  uid: string,
  reqId: string,
  approvedBy: string
) {
  await updateDoc(doc(db, "users", uid, "emergencyRequests", reqId), { 
    status: "approved", 
    approvedBy,
    updatedAt: new Date().toISOString()
  });
  clearCache(`emergencies_${uid}`);

  // Trigger: Notify Member of approval
  await notifyUser(
    uid,
    "Emergency Loan Approved",
    "Your emergency request has been approved by the President and is waiting for disbursement.",
    "emergency_approved"
  );
}

export async function rejectEmergencyRequest(
  uid: string,
  reqId: string,
  rejectionReason: string
) {
  await updateDoc(doc(db, "users", uid, "emergencyRequests", reqId), { 
    status: "rejected", 
    rejectionReason,
    updatedAt: new Date().toISOString()
  });

  // Trigger: Notify Member of rejection
  await notifyUser(
    uid,
    "Emergency Loan Rejected",
    `Your emergency request has been rejected. Reason: ${rejectionReason}`,
    "emergency_rejected"
  );
}

export async function disburseEmergencyRequest(
  uid: string,
  reqId: string,
  releasingTreasurerId: string
) {
  const reqRef = doc(db, "users", uid, "emergencyRequests", reqId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request not found");
  const req = reqSnap.data() as EmergencyRequest;

  // 1. Update request status
  await updateDoc(reqRef, { 
    status: "disbursed", 
    disbursedBy: releasingTreasurerId,
    disbursedAt: new Date().toISOString()
  });

  // 2. Update user balances (Only now the money is officially "taken")
  await updateDoc(doc(db, "users", uid), {
    emergencyTaken: increment(req.amount),
    interestOwed: increment(req.interestAmount),
  });
  clearCache(`emergencies_${uid}`);
  clearCache(`payments_${uid}`);
  clearCache("user");

  // 3. Log an official disbursement transaction
  await addDoc(collection(db, "users", uid, "payments"), {
    amount: req.amount,
    date: new Date().toISOString(),
    year: new Date().getFullYear(),
    provider: "System Disbursement",
    status: "completed",
    note: `Emergency Loan Disbursed: ${formatRF(req.amount)}`,
  });

  // Trigger: Notify Member of disbursement
  await notifyUser(
    uid,
    "Funds Released",
    `Your emergency loan of ${formatRF(req.amount)} has been disbursed to your account.`,
    "emergency_approved"
  );
}

export async function checkOverdueEmergencies(uid: string) {
  const reqsSnap = await getDocs(
    query(
      collection(db, "users", uid, "emergencyRequests"), 
      where("status", "==", "disbursed")
    )
  );

  const now = new Date();
  let totalPenaltyToAdd = 0;
  const updates: Promise<any>[] = [];

  for (const snap of reqsSnap.docs) {
    const data = snap.data() as EmergencyRequest;
    if (!data.penaltyApplied && new Date(data.dueDate) < now) {
      const penalty = data.amount * 0.10; // 10% penalty
      totalPenaltyToAdd += penalty;

      // Update the request document itself
      updates.push(updateDoc(doc(db, "users", uid, "emergencyRequests", snap.id), {
        interestRate: 0.15, // 5% base + 10% penalty
        interestAmount: increment(penalty),
        penaltyApplied: true,
        updatedAt: now.toISOString()
      }));
    }
  }

  if (totalPenaltyToAdd > 0) {
    // Update the user's total interest owed
    updates.push(updateDoc(doc(db, "users", uid), {
      interestOwed: increment(totalPenaltyToAdd)
    }));
    await Promise.all(updates);
    return true; // Penalties were applied
  }

  return false;
}

export async function checkAnnualShortfallPenalties(uid: string) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  
  const user = userSnap.data() as CampusUser;
  const startYear = new Date(user.createdAt as any).getFullYear();
  const currentYear = new Date().getFullYear();
  
  // Get all payments to calculate yearly progress
  const paymentsSnap = await getDocs(collection(db, "users", uid, "payments"));
  const payments = paymentsSnap.docs.map(d => d.data() as any);
  
  const yearlyRoadmap = calculateYearlyPayments(payments, user.totalShareValue, startYear);
  const penalizedYears = user.penalizedYears || [];
  
  let totalPenaltyToAdd = 0;
  const newlyPenalizedYears: number[] = [];
  
  // Only check years in the past
  const pastYears = yearlyRoadmap.filter((y: any) => y.year < currentYear);
  
  for (const yearData of pastYears) {
    if (!yearData.isCompleted && !penalizedYears.includes(yearData.year)) {
      const shortfall = yearData.target - yearData.paid;
      if (shortfall > 0) {
        const penalty = shortfall * 0.50; // 50% penalty
        totalPenaltyToAdd += penalty;
        newlyPenalizedYears.push(yearData.year);
      }
    }
  }
  
  if (totalPenaltyToAdd > 0) {
    await updateDoc(userRef, {
      shortfallPenaltyOwed: increment(totalPenaltyToAdd),
      penalizedYears: arrayUnion(...newlyPenalizedYears),
      updatedAt: new Date().toISOString()
    });
    return totalPenaltyToAdd;
  }
  
  return 0;
}

export async function getUserEmergencyRequests(uid: string): Promise<EmergencyRequest[]> {
  const cacheKey = `emergencies_${uid}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const snap = await getDocs(
    query(collection(db, "users", uid, "emergencyRequests"), orderBy("requestedAt", "desc"))
  );
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmergencyRequest));
  setCache(cacheKey, data);
  return data;
}

export async function repayEmergency(
  uid: string, 
  amount: number, 
  provider: string,
  currentInterest: number,
  currentPrincipal: number
) {
  const userRef = doc(db, "users", uid);
  
  // Logic: Repay interest first, then principal
  let interestRepaid = Math.min(amount, currentInterest);
  let principalRepaid = Math.max(0, amount - interestRepaid);
  
  // Cap principal repayment to what is actually owed
  principalRepaid = Math.min(principalRepaid, currentPrincipal);
  
  await updateDoc(userRef, {
    interestOwed: increment(-interestRepaid),
    emergencyTaken: increment(-principalRepaid),
  });

  // Log as a special payment record
  await addDoc(collection(db, "users", uid, "payments"), {
    amount: amount,
    date: new Date().toISOString(),
    year: new Date().getFullYear(),
    provider: provider,
    note: `Emergency Repay: ${interestRepaid > 0 ? 'Interest ' : ''}${principalRepaid > 0 ? '+ Principal' : ''}`,
  });

  // Logic: If debt is fully cleared, mark all disbursed requests as paid
  const userSnap = await getDoc(userRef);
  const user = userSnap.data() as CampusUser;
  if ((user.emergencyTaken || 0) <= 0 && (user.interestOwed || 0) <= 0) {
    const eSnap = await getDocs(
      query(collection(db, "users", uid, "emergencyRequests"), where("status", "==", "disbursed"))
    );
    for (const d of eSnap.docs) {
      await updateDoc(d.ref, { 
        status: "paid", 
        updatedAt: new Date().toISOString() 
      });
    }
  }
}
export async function recordTreasurerEmergencyPayback(
  uid: string, 
  amount: number, 
  note: string,
  currentInterest: number,
  currentPrincipal: number
) {
  const userRef = doc(db, "users", uid);
  
  // Logic: Repay interest first, then principal (standard rule)
  let interestRepaid = Math.min(amount, currentInterest);
  let principalRepaid = Math.max(0, amount - interestRepaid);
  
  // Cap principal repayment to what is actually owed
  principalRepaid = Math.min(principalRepaid, currentPrincipal);
  
  // 1. Update balances
  await updateDoc(userRef, {
    interestOwed: increment(-interestRepaid),
    emergencyTaken: increment(-principalRepaid),
    updatedAt: new Date().toISOString()
  });
  clearCache("user");
  clearCache(`emergencies_${uid}`);
  clearCache(`payments_${uid}`);

  // Log as an official Treasurer Manual payment record
  await addDoc(collection(db, "users", uid, "payments"), {
    amount: amount,
    date: new Date().toISOString(),
    year: new Date().getFullYear(),
    provider: "Treasurer Manual (Cash/Bank)",
    note: note || `Emergency Repay: ${interestRepaid > 0 ? 'Interest ' : ''}${principalRepaid > 0 ? '+ Principal' : ''}`,
    status: "completed"
  });

  // Trigger: Notify Member of payback
  await notifyUser(
    uid,
    "Emergency Payback Recorded",
    `A payback of ${formatRF(amount)} has been recorded for your emergency loan.`,
    "payment"
  );

  // Logic: If debt is fully cleared, mark all disbursed requests as paid
  const userSnap = await getDoc(userRef);
  const user = userSnap.data() as CampusUser;
  if ((user.emergencyTaken || 0) <= 0 && (user.interestOwed || 0) <= 0) {
    const eSnap = await getDocs(
      query(collection(db, "users", uid, "emergencyRequests"), where("status", "==", "disbursed"))
    );
    for (const d of eSnap.docs) {
      await updateDoc(d.ref, { 
        status: "paid", 
        updatedAt: new Date().toISOString() 
      });
    }
  }
}

export async function repayShortfallPenalty(uid: string, amount: number, provider: string) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    shortfallPenaltyOwed: increment(-amount),
    updatedAt: new Date().toISOString()
  });
  clearCache("user");

  // Log as a special payment record
  await addDoc(collection(db, "users", uid, "payments"), {
    amount: amount,
    date: new Date().toISOString(),
    year: new Date().getFullYear(),
    provider: provider,
    note: `Annual Shortfall Penalty Repayment`,
  });
}

export async function getAllPendingEmergencyRequests() {
  const q = query(
    collectionGroup(db, "emergencyRequests"),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  const results: Array<EmergencyRequest & { userDoc: Partial<CampusUser> }> = [];
  
  for (const d of snap.docs) {
    const data = d.data() as EmergencyRequest;
    // We still need the user doc for the full name etc., but now we only fetch what we found
    const userSnap = await getDoc(doc(db, "users", data.userId));
    results.push({
      ...data,
      id: d.id,
      userDoc: userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } : {},
    } as any);
  }
  return results;
}

export async function getAllApprovedEmergencyRequests() {
  const q = query(
    collectionGroup(db, "emergencyRequests"),
    where("status", "==", "approved")
  );
  const snap = await getDocs(q);
  const results: Array<EmergencyRequest & { userDoc: Partial<CampusUser> }> = [];
  
  for (const d of snap.docs) {
    const data = d.data() as EmergencyRequest;
    const userSnap = await getDoc(doc(db, "users", data.userId));
    results.push({
      ...data,
      id: d.id,
      userDoc: userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } : {},
    } as any);
  }
  return results;
}

export async function getAllDisbursedEmergencyRequests() {
  const q = query(
    collectionGroup(db, "emergencyRequests"),
    where("status", "==", "disbursed")
  );
  const snap = await getDocs(q);
  const results: Array<EmergencyRequest & { userDoc: Partial<CampusUser> }> = [];
  
  for (const d of snap.docs) {
    const data = d.data() as EmergencyRequest;
    const userSnap = await getDoc(doc(db, "users", data.userId));
    results.push({
      ...data,
      id: d.id,
      userDoc: userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } : {},
    } as any);
  }
  return results;
}

export async function getAllEmergencyRequests() {
  const snap = await getDocs(collectionGroup(db, "emergencyRequests"));
  const results: Array<EmergencyRequest & { userDoc: Partial<CampusUser> }> = [];
  
  for (const d of snap.docs) {
    const data = d.data() as EmergencyRequest;
    const userSnap = await getDoc(doc(db, "users", data.userId));
    results.push({
      ...data,
      id: d.id,
      userDoc: userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } : {},
    } as any);
  }
  return results;
}

// ── Proposals ────────────────────────────────────────────────────────────────

export async function getProposals(): Promise<Proposal[]> {
  const cacheKey = "proposals";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const snap = await getDocs(
    query(collection(db, "proposals"), orderBy("proposedAt", "desc"))
  );
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal));
  setCache(cacheKey, data);
  return data;
}

export async function createProposal(proposal: Omit<Proposal, "id">) {
  const res = await addDoc(collection(db, "proposals"), proposal);
  clearCache("proposals");
  return res;
}

export async function updateProposalStatus(proposalId: string, status: Proposal['status']) {
  const res = await updateDoc(doc(db, "proposals", proposalId), { status });
  clearCache("proposals");
  return res;
}

export function subscribeToProposals(callback: (proposals: Proposal[]) => void) {
  return onSnapshot(
    query(collection(db, "proposals"), orderBy("proposedAt", "desc")),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal)));
    }
  );
}

export async function voteOnProposal(
  proposalId: string,
  userId: string,
  vote: "yes" | "no",
  totalVoters: number
) {
  const ref = doc(db, "proposals", proposalId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Proposal not found");

    const data = snap.data() as Proposal;
    const existingVote = data.votes.voters[userId];
    
    const votes = { ...data.votes };
    const voters = { ...votes.voters };

    if (existingVote === vote) {
      // TOGGLE OFF
      votes[vote] = Math.max(0, votes[vote] - 1);
      delete voters[userId];
      votes.totalVoters = Math.max(0, votes.totalVoters - 1);
    } else if (existingVote) {
      // SWITCH
      const otherVote = existingVote === 'yes' ? 'no' : 'yes';
      votes[otherVote] = Math.max(0, votes[otherVote] - 1);
      votes[vote] = votes[vote] + 1;
      voters[userId] = vote;
    } else {
      // NEW VOTE
      votes[vote] = votes[vote] + 1;
      voters[userId] = vote;
      votes.totalVoters = votes.totalVoters + 1;
    }

    votes.voters = voters;

    // Check status
    const requiredYesStr = data.requiredPercentage || 70;
    const requiredYesVotes = Math.ceil(totalVoters * (requiredYesStr / 100));
    const currentTotalVotes = votes.yes + votes.no;
    
    let newStatus = data.status;
    if (votes.yes >= requiredYesVotes) {
      newStatus = "approved";
    } else if (currentTotalVotes >= totalVoters && votes.yes < requiredYesVotes) {
      newStatus = "rejected";
    } else if (data.status === 'approved' || data.status === 'rejected') {
      if (data.status === 'approved' && votes.yes < requiredYesVotes) {
        newStatus = 'active';
      }
    }

    transaction.update(ref, {
      votes: votes,
      status: newStatus
    });
  });
}

export async function addProposalComment(
  proposalId: string,
  comment: Proposal["comments"][0]
) {
  await updateDoc(doc(db, "proposals", proposalId), {
    comments: arrayUnion(comment),
  });
}

// ── Meetings ─────────────────────────────────────────────────────────────────

export async function getMeetings(): Promise<Meeting[]> {
  const cacheKey = "meetings";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const snap = await getDocs(
    query(collection(db, "meetings"), orderBy("date", "desc"))
  );
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Meeting));
  setCache(cacheKey, data);
  return data;
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const snap = await getDoc(doc(db, "meetings", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Meeting) : null;
}

export async function createMeeting(meeting: Omit<Meeting, "id">) {
  const res = await addDoc(collection(db, "meetings"), meeting);
  clearCache("meetings");
  return res;
}

export async function updateMeeting(meetingId: string, data: Partial<Meeting>) {
  await updateDoc(doc(db, "meetings", meetingId), { ...data });
}

export async function addAttendeeToMeeting(meetingId: string, userId: string) {
  await updateDoc(doc(db, "meetings", meetingId), {
    attendees: arrayUnion(userId)
  });
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(notif: Omit<Notification, "id">) {
  return await addDoc(collection(db, "notifications"), notif);
}

export async function getUserNotifications(uid: string): Promise<Notification[]> {
  const snap = await getDocs(
    query(
      collection(db, "notifications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
}

export async function markNotificationRead(notifId: string) {
  await updateDoc(doc(db, "notifications", notifId), { read: true });
}

export async function markAllNotificationsRead(uid: string) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { read: true });
  });
  await batch.commit();
}

export function subscribeToNotifications(
  uid: string,
  callback: (notifs: Notification[]) => void,
  limitCount: number = 20
) {
  return onSnapshot(
    query(
      collection(db, "notifications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    ),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
    }
  );
}

export async function notifyUser(userId: string, title: string, message: string, type: Notification["type"]) {
  return await createNotification({
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function notifyAdmins(title: string, message: string, type: Notification["type"]) {
  const users = await getAllUsers();
  const admins = users.filter(u => u.role === 'president' || u.role === 'treasurer');
  const promises = admins.map(admin => notifyUser(admin.uid, title, message, type));
  return await Promise.all(promises);
}

export async function notifyAllUsers(title: string, message: string, type: Notification["type"]) {
  const users = await getAllUsers();
  const promises = users.map(user => notifyUser(user.uid, title, message, type));
  return await Promise.all(promises);
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function saveUserDocument(uid: string, docData: Omit<UserDocument, "id">) {
  return await addDoc(collection(db, "users", uid, "documents"), docData);
}

export async function getUserDocuments(uid: string): Promise<UserDocument[]> {
  const snap = await getDocs(collection(db, "users", uid, "documents"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDocument));
}

// ── Global Query Cache ─────────────────────────────────────────────
const queryCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache

function getCached(key: string) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  queryCache.set(key, { data, timestamp: Date.now() });
}

// Clear relevant cache on mutations
export function clearCache(keyPattern?: string) {
  if (!keyPattern) {
    queryCache.clear();
    return;
  }
  for (const key of queryCache.keys()) { // Corrected from .Keys() to .keys()
    if (key.includes(keyPattern)) queryCache.delete(key);
  }
}

// ── Dividend Management ────────────────────────────────────────────────────────

export async function getDividendProjects(): Promise<DividendProject[]> {
  const snap = await getDocs(collection(db, "dividendProjects"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DividendProject));
}

export async function getDividendProject(id: string): Promise<DividendProject | null> {
  const snap = await getDoc(doc(db, "dividendProjects", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as DividendProject) : null;
}

export async function createDividendProject(project: Omit<DividendProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, "dividendProjects"), {
    ...project,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateDividendProject(id: string, data: Partial<DividendProject>) {
  await updateDoc(doc(db, "dividendProjects", id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserDividends(userId: string): Promise<DividendDistribution[]> {
  const snap = await getDocs(
    query(collection(db, "users", userId, "dividends"), orderBy("distributionDate", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DividendDistribution));
}

export async function distributeDividends(projectId: string, perShareAmount: number): Promise<void> {
  const settings = await getSystemSettings();
  const sharePrice = settings?.shareUnitPrice || 1000;
  
  const usersSnap = await getDocs(collection(db, "users"));
  const batch = writeBatch(db);

  usersSnap.forEach((userDoc) => {
    const user = userDoc.data() as CampusUser;
    const sharesOwned = user.totalShareValue / sharePrice;
    
    if (sharesOwned > 0) {
      const dividendAmount = sharesOwned * perShareAmount;
      const dividendRef = doc(collection(db, "users", userDoc.id, "dividends"));
      
      batch.set(dividendRef, {
        projectId,
        userId: userDoc.id,
        sharesOwned,
        dividendAmount,
        perShareAmount,
        distributionDate: new Date().toISOString(),
        status: 'distributed' as const,
      });
    }
  });

  await batch.commit();
}

export async function claimDividend(userId: string, dividendId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId, "dividends", dividendId), {
    status: 'claimed',
    claimedAt: new Date().toISOString(),
  });
  clearCache("user");
}

export async function getUserDividendSummary(userId: string): Promise<UserDividendSummary> {
  const dividends = await getUserDividends(userId);
  
  const totalDividends = dividends.reduce((sum, d) => sum + d.dividendAmount, 0);
  const claimedDividends = dividends.filter(d => d.status === 'claimed').reduce((sum, d) => sum + d.dividendAmount, 0);
  const pendingDividends = dividends.filter(d => d.status === 'distributed').reduce((sum, d) => sum + d.dividendAmount, 0);

  // Get project names for the summary
  const projectIds = [...new Set(dividends.map(d => d.projectId))];
  const projectDocs = await Promise.all(
    projectIds.map(id => getDoc(doc(db, "dividendProjects", id)))
  );
  
  const projectMap = new Map(
    projectDocs.map(doc => [doc.id, doc.data() as DividendProject])
  );

  const projects = dividends.map(d => ({
    projectId: d.projectId,
    projectName: projectMap.get(d.projectId)?.name || 'Unknown Project',
    dividendAmount: d.dividendAmount,
    status: d.status,
    distributionDate: d.distributionDate,
  }));

  return {
    totalDividends,
    claimedDividends,
    pendingDividends,
    projects,
  };
}

// ── Campus Info ───────────────────────────────────────────────────────────────

export async function getCampusInfo(): Promise<CampusInfo[]> {
  const snap = await getDocs(
    query(collection(db, "campusInfo"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusInfo));
}

export function subscribeToCampusInfo(callback: (info: CampusInfo[]) => void) {
  return onSnapshot(
    query(collection(db, "campusInfo"), orderBy("createdAt", "desc")),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusInfo)));
    }
  );
}

export async function createCampusInfo(info: Omit<CampusInfo, 'id' | 'createdAt' | 'views'>): Promise<string> {
  const docRef = await addDoc(collection(db, "campusInfo"), {
    ...info,
    createdAt: new Date().toISOString(),
    views: 0,
  });
  return docRef.id;
}

export async function publishCampusInfo(id: string): Promise<void> {
  await updateDoc(doc(db, "campusInfo", id), {
    status: 'published',
    publishedAt: new Date().toISOString(),
  });
}

export async function incrementCampusInfoViews(id: string): Promise<void> {
  await updateDoc(doc(db, "campusInfo", id), {
    views: increment(1),
  });
}

// ── System Settings ──────────────────────────────────────────────────────────

export async function getSystemSettings() {
  const ref = doc(db, "settings", "system");
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  // Default settings if not found
  return {
    shareUnitPrice: 1000,
    minShareThreshold: 400000,
    updatedAt: new Date().toISOString()
  };
}

export async function updateSystemSettings(data: any) {
  const ref = doc(db, "settings", "system");
  const oldSettings = await getSystemSettings();
  await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });

  // Trigger: Notify everyone if share value changed
  if (oldSettings.shareUnitPrice !== data.shareUnitPrice) {
    await notifyAllUsers(
      "Share Value Updated",
      `The value of one share has been updated to ${formatRF(data.shareUnitPrice)}.`,
      "general"
    );
  }
}

// ── Share Transfer Transaction ───────────────────────────────────────────────

export async function transferShares(senderId: string, recipientId: string, amount: number) {
  const senderRef = doc(db, "users", senderId);
  const recipientRef = doc(db, "users", recipientId);

  return await runTransaction(db, async (transaction) => {
    const senderSnap = await transaction.get(senderRef);
    const recipientSnap = await transaction.get(recipientRef);

    if (!senderSnap.exists()) throw new Error("Sender not found");
    if (!recipientSnap.exists()) throw new Error("Recipient not found");

    const sender = senderSnap.data() as CampusUser;
    
    // Strict business rules
    if (sender.paidSoFar < 400000) {
      throw new Error("You must have at least 400,000 RF to transfer shares.");
    }
    if (sender.paidSoFar < amount) {
      throw new Error("Insufficient shares to complete this transfer.");
    }

    // Atomic updates - Update both actual equity (paidSoFar) and commitment (totalShareValue)
    transaction.update(senderRef, {
      paidSoFar: increment(-amount),
      totalShareValue: increment(-amount)
    });

    transaction.update(recipientRef, {
      paidSoFar: increment(amount),
      totalShareValue: increment(amount)
    });
    clearCache("user");

    // Log for sender
    const senderLogRef = doc(collection(db, "users", senderId, "payments"));
    transaction.set(senderLogRef, {
      amount: -amount,
      date: new Date().toISOString(),
      year: new Date().getFullYear(),
      provider: "System Transfer",
      note: `Shares Transferred to ${recipientSnap.data().fullName}`,
      status: "completed"
    });

    // Log for recipient
    const recipientLogRef = doc(collection(db, "users", recipientId, "payments"));
    transaction.set(recipientLogRef, {
      amount: amount,
      date: new Date().toISOString(),
      year: new Date().getFullYear(),
      provider: "System Transfer",
      note: `Shares Received from ${sender.fullName}`,
      status: "completed"
    });
  });
}

export async function recordAdminPayment(userId: string, amount: number, note?: string): Promise<void> {
  const userRef = doc(db, "users", userId);
  
  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error("User not found");

    // 1. Update user monetary balance only (as per institutional rules)
    transaction.update(userRef, {
      paidSoFar: increment(amount)
    });
    clearCache("user");

    // 2. Record the payment log
    const paymentLogRef = doc(collection(db, "users", userId, "payments"));
    transaction.set(paymentLogRef, {
      amount,
      date: new Date().toISOString(),
      year: new Date().getFullYear(),
      provider: "Admin/Treasurer Manual",
      note: note || "Manual savings recorded by Treasurer",
      status: "completed"
    });
  });

  // Trigger: Notify Member of manual saving
  await notifyUser(
    userId,
    "Savings Recorded",
    `A manual deposit of ${formatRF(amount)} has been recorded into your savings account.`,
    "payment"
  );
}

// ── Meeting Comments ────────────────────────────────────────────────────────

export async function addMeetingComment(meetingId: string, comment: Omit<MeetingComment, "id">) {
  const ref = await addDoc(collection(db, "meetings", meetingId, "comments"), comment);
  return ref.id;
}

export async function getMeetingComments(meetingId: string): Promise<MeetingComment[]> {
  const q = query(
    collection(db, "meetings", meetingId, "comments"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MeetingComment));
}

// ── Project Drafts ──────────────────────────────────────────────────────────

export const createProjectDraft = async (draft: Omit<ProjectDraft, 'id'>) => {
  const docRef = await addDoc(collection(db, "projectDrafts"), {
    ...draft,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateProjectDraft = async (id: string, updates: Partial<ProjectDraft>) => {
  const docRef = doc(db, "projectDrafts", id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

export const getProjectDrafts = async (role: UserRole, uid: string) => {
  const draftsRef = collection(db, "projectDrafts");
  let q;
  
  if (role === 'boardMember' || role === 'president') {
    // Board members see submitted/reviewing drafts
    q = query(draftsRef, where("status", "in", ["submitted", "under_review", "feedback_given"]), orderBy("updatedAt", "desc"));
  } else {
    // Investors see their own drafts
    q = query(draftsRef, where("createdBy", "==", uid), orderBy("updatedAt", "desc"));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectDraft));
};

export const addDraftComment = async (draftId: string, comment: ProposalComment) => {
  const draftRef = doc(db, "projectDrafts", draftId);
  await updateDoc(draftRef, {
    comments: arrayUnion(comment),
    updatedAt: new Date().toISOString()
  });
};

export const deleteProjectDraft = async (id: string) => {
  const docRef = doc(db, "projectDrafts", id);
  await deleteDoc(docRef);
};

// ── Share Marketplace ──────────────────────────────────────────────────────

export async function createShareListing(uid: string, userName: string, amount: number, price: number, isLiquidation: boolean) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User not found");
  const user = userSnap.data() as CampusUser;
  const settings = await getSystemSettings();
  const sharePrice = settings.shareUnitPrice || 1000;

  // 1. Check for existing active listings to prevent over-listing
  const activeListingsSnap = await getDocs(query(
    collection(db, "marketListings"),
    where("sellerId", "==", uid),
    where("status", "==", "open")
  ));
  
  const alreadyListedShares = activeListingsSnap.docs.reduce((sum, d) => sum + (d.data() as ShareListing).availableShares, 0);
  const totalUserShares = user.paidSoFar / sharePrice;

  if (isLiquidation && !activeListingsSnap.empty) {
    throw new Error("You already have active listings. Please close them before liquidating your entire portfolio.");
  }

  if (amount > (totalUserShares - alreadyListedShares + 0.001)) { // Floating point safety
    throw new Error(`Insufficient available shares. You already have ${Math.round(alreadyListedShares)} units listed on the market.`);
  }

  // Rule: Must be > 400,000 RF to sell partial. 
  // If not liquidation, the remainder must be >= 400,000
  const amountInRF = amount * sharePrice;

  if (!isLiquidation) {
    if (user.paidSoFar - amountInRF < 400000) {
      throw new Error(`You must maintain at least 400 shares (${formatRF(400000)}) unless you are leaving Campus Link.`);
    }
  } else {
    // If liquidation, must sell ALL shares
    if (Math.abs(amountInRF - user.paidSoFar) > 1) { // Floating point safety
      throw new Error(`When leaving Campus Link, you must list all your shares (${Math.round(user.paidSoFar / sharePrice)} units) for sale.`);
    }
  }

  const listing: Omit<ShareListing, 'id'> = {
    sellerId: uid,
    sellerName: userName,
    totalShares: amount,
    availableShares: amount,
    pricePerShare: price,
    isLiquidation,
    status: 'open',
    createdAt: new Date().toISOString()
  };

  return await addDoc(collection(db, "marketListings"), listing);
}

export async function getMarketListings(): Promise<ShareListing[]> {
  const q = query(
    collection(db, "marketListings"), 
    where("status", "==", "open"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShareListing));
}

export function subscribeToMarketListings(callback: (listings: ShareListing[]) => void) {
  const q = query(
    collection(db, "marketListings"), 
    where("status", "==", "open"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShareListing)));
  });
}

export async function createShareOffer(listingId: string, buyerId: string, buyerName: string, amount: number, price: number, sellerId: string) {
  const offer: Omit<ShareOffer, 'id'> = {
    listingId,
    sellerId,
    buyerId,
    buyerName,
    requestedShares: amount,
    pricePerShare: price,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  return await addDoc(collection(db, "marketListings", listingId, "offers"), offer);
}

export async function getListingOffers(listingId: string): Promise<ShareOffer[]> {
  const snap = await getDocs(collection(db, "marketListings", listingId, "offers"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShareOffer));
}

export async function acceptShareOffer(offer: ShareOffer) {
  const listingRef = doc(db, "marketListings", offer.listingId);
  const sellerRef = doc(db, "users", offer.sellerId);
  const buyerRef = doc(db, "users", offer.buyerId);
  
  await runTransaction(db, async (transaction) => {
    const listingSnap = await transaction.get(listingRef);
    const sellerSnap = await transaction.get(sellerRef);
    const buyerSnap = await transaction.get(buyerRef);
    
    if (!listingSnap.exists() || !sellerSnap.exists() || !buyerSnap.exists()) {
      throw new Error("Missing data to complete trade.");
    }
    
    const listing = listingSnap.data() as ShareListing;
    const seller = sellerSnap.data() as CampusUser;
    
    if (listing.availableShares < offer.requestedShares) {
      throw new Error("Insufficient shares available in this listing.");
    }

    const settings = await transaction.get(doc(db, "settings", "system"));
    const sharePrice = settings.exists() ? (settings.data().shareUnitPrice || 1000) : 1000;
    const shareValueInRF = offer.requestedShares * sharePrice;

    // 1. Update balances
    transaction.update(sellerRef, {
      paidSoFar: increment(-shareValueInRF),
      totalShareValue: increment(-shareValueInRF)
    });
    
    transaction.update(buyerRef, {
      paidSoFar: increment(shareValueInRF),
      totalShareValue: increment(shareValueInRF)
    });

    // 2. Update listing
    const newAvailable = listing.availableShares - offer.requestedShares;
    transaction.update(listingRef, {
      availableShares: newAvailable,
      status: newAvailable === 0 ? 'closed' : 'open'
    });

    // 3. Update offer status
    transaction.update(doc(db, "marketListings", offer.listingId, "offers", offer.id), {
      status: 'accepted'
    });

    // 4. Log transactions
    const logBatch = [
      { 
        uid: offer.sellerId, 
        amount: -shareValueInRF, 
        note: `Sold ${offer.requestedShares} shares to ${offer.buyerName} @ ${offer.pricePerShare} RF` 
      },
      { 
        uid: offer.buyerId, 
        amount: shareValueInRF, 
        note: `Bought ${offer.requestedShares} shares from ${listing.sellerName} @ ${offer.pricePerShare} RF` 
      }
    ];

    for (const log of logBatch) {
      const ref = doc(collection(db, "users", log.uid, "payments"));
      transaction.set(ref, {
        amount: log.amount,
        date: new Date().toISOString(),
        year: new Date().getFullYear(),
        provider: "Market Trade",
        note: log.note,
        status: "completed"
      });
    }

    // 5. Official Market Audit Log
    const auditRef = doc(collection(db, "marketHistory"));
    transaction.set(auditRef, {
      sellerId: offer.sellerId,
      sellerName: listing.sellerName,
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      shares: offer.requestedShares,
      pricePerShare: offer.pricePerShare,
      totalPrice: offer.requestedShares * offer.pricePerShare,
      listingId: offer.listingId,
      createdAt: new Date().toISOString()
    });
  });
}

export async function getMarketHistory(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "marketHistory"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
