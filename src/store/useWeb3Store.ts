import { create } from 'zustand';

interface Web3State {
  isConnected: boolean;
  walletAddress: string | null;
  balance: number;
  connect: (address: string) => void;
  disconnect: () => void;
  setBalance: (balance: number) => void;
}

export const useWeb3Store = create<Web3State>((set) => ({
  isConnected: false,
  walletAddress: null,
  balance: 0,
  connect: (address) => set({ isConnected: true, walletAddress: address }),
  disconnect: () => set({ isConnected: false, walletAddress: null, balance: 0 }),
  setBalance: (balance) => set({ balance }),
}));
