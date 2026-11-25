/**
 * Phase 2+ Future Architecture Contracts for Campus Life.
 *
 * These interfaces define clean integration seams for upcoming systems
 * without coupling Phase 1 rendering or movement code to unimplemented backends.
 */

import type { CharacterAppearance } from './game';

/** 1. Multiplayer Networking & Presence */
export interface RemotePlayerState {
  playerId: string;
  displayName: string;
  appearance: CharacterAppearance;
  position: { x: number; y: number; z: number };
  rotationYaw: number;
  velocity: { x: number; y: number; z: number };
  isSprinting: boolean;
  grounded: boolean;
  lastUpdatedMs: number;
}

export interface MultiplayerTransportContract {
  connect(sessionToken: string, roomId: string): Promise<void>;
  disconnect(): Promise<void>;
  broadcastLocalState(state: Omit<RemotePlayerState, 'playerId' | 'displayName' | 'appearance'>): void;
  onRemotePlayersChanged(listener: (players: ReadonlyArray<RemotePlayerState>) => void): () => void;
}

/** 2. Player Accounts & Academic Profile */
export interface PlayerAccountProfile {
  accountId: string;
  matricNumber: string;
  fullName: string;
  faculty: string;
  department: string;
  level: 100 | 200 | 300 | 400 | 500;
  appearance: CharacterAppearance;
  createdAtIso: string;
}

export interface AuthServiceContract {
  getCurrentAccount(): Promise<PlayerAccountProfile | null>;
  signInWithEmail(email: string): Promise<PlayerAccountProfile>;
  signOut(): Promise<void>;
}

/** 3. Player Inventory */
export interface InventoryItem {
  itemId: string;
  name: string;
  category: 'book' | 'device' | 'food' | 'apparel' | 'keycard' | 'misc';
  quantity: number;
  maxStack: number;
  iconKey: string;
}

export interface PlayerInventoryContract {
  getItems(accountId: string): Promise<ReadonlyArray<InventoryItem>>;
  addItem(accountId: string, itemId: string, quantity: number): Promise<void>;
  consumeItem(accountId: string, itemId: string, quantity: number): Promise<boolean>;
}

/** 4. Nigerian Naira (NGN) Virtual Economy & 5. Banking / Player Transfers */
export type NairaKobo = number;

export interface NairaWallet {
  walletId: string;
  accountId: string;
  balanceNgn: number;
  bankName: 'Campus Microfinance' | 'Campus Trust Bank';
  accountNumber: string;
}

export interface CurrencyTransaction {
  transactionId: string;
  fromWalletId: string;
  toWalletId: string;
  amountNgn: number;
  narration: string;
  timestampIso: string;
  status: 'pending' | 'settled' | 'failed';
}

export interface BankingServiceContract {
  getWallet(accountId: string): Promise<NairaWallet>;
  transferNaira(
    fromAccountId: string,
    toAccountNumber: string,
    amountNgn: number,
    narration: string
  ): Promise<CurrencyTransaction>;
  getLedger(walletId: string, limit?: number): Promise<ReadonlyArray<CurrencyTransaction>>;
}

/** 6. Missions & 7. Campus Virtual Jobs */
export interface MissionDefinition {
  missionId: string;
  title: string;
  description: string;
  locationZoneId: string;
  rewardNgn: number;
  academicPoints: number;
}

export interface MissionProgress {
  missionId: string;
  status: 'available' | 'active' | 'completed';
  currentStep: number;
  totalSteps: number;
}

export interface JobShiftContract {
  jobId: string;
  title: string;
  employerName: string;
  zoneId: string;
  hourlyPayNgn: number;
  startShift(accountId: string): Promise<{ shiftId: string }>;
  completeShift(shiftId: string): Promise<{ earnedNgn: number }>;
}

/** 8. Hostels & Accommodation */
export interface HostelAccommodation {
  hostelId: string;
  hallName: string;
  roomNumber: string;
  capacity: 1 | 2 | 4;
  semesterRentNgn: number;
  occupantIds: ReadonlyArray<string>;
}

/** 9. Academic Activities & Timetable */
export interface AcademicActivity {
  activityId: string;
  courseCode: string;
  courseTitle: string;
  venueZoneId: string;
  lecturerName: string;
  startsAtCampusTime: string;
  durationMinutes: number;
  attendanceCredit: number;
}
