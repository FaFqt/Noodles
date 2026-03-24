export interface PlayerWallet {
  provider: "cartridge";
  profileName: string;
  address: string;
  network: "sepolia" | "mainnet";
  connectedAt: number;
  balance?: string | null;
  dojoRegistered?: boolean;
}
