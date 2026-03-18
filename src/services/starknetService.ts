import { Contract, Account, Provider, constants } from 'starknet';

// Contract ABIs and addresses will be defined here
export interface ContractConfig {
  address: string;
  abi: any[];
}

// Example contract configurations
export const CONTRACTS = {
  // Add your contract addresses and ABIs here
  NOODLES_GAME: {
    address: '0x0', // Replace with actual deployed contract address
    abi: [], // Import ABI from compiled contract
  },
  ERC20_TOKEN: {
    address: '0x0', // Replace with token contract address
    abi: [], // ERC20 ABI
  },
} as const;

export class StarknetService {
  private provider: Provider;
  private account: Account | null = null;

  constructor(network: 'sepolia' | 'mainnet' = 'sepolia') {
    // Initialize provider based on network
    const rpcUrl = network === 'mainnet'
      ? 'https://starknet-mainnet.publicnode.com'
      : 'https://starknet-sepolia.publicnode.com';

    // Provider constructor expects an options object; in recent
    // versions you can supply nodeUrl directly.
    this.provider = new Provider({
      nodeUrl: rpcUrl
    });
  }

  // Set the connected account
  setAccount(account: Account) {
    this.account = account;
  }

  // Get contract instance
  getContract(contractName: keyof typeof CONTRACTS) {
    const config = CONTRACTS[contractName];
    if (!config.address || config.address === '0x0') {
      throw new Error(`Contract ${contractName} not configured with valid address`);
    }

    // Construct the contract using the library's options object.
    // In the latest starknet.js API the constructor expects a single
    // `ContractOptions` object rather than separate parameters.
    const contract: any = new Contract({
      abi: config.abi,
      address: config.address,
      providerOrAccount: this.provider,
    });

    // `Contract` already has the provider attached above, but keep the
    // method available for backwards compatibility if needed.
    if (typeof contract.setProvider === 'function') {
      contract.setProvider(this.provider);
    }

    return contract;
  }

  // Connect contract to account for transactions
  getConnectedContract(contractName: keyof typeof CONTRACTS) {
    if (!this.account) {
      throw new Error('No account connected');
    }

    const contract = this.getContract(contractName);
    contract.connect(this.account);
    return contract;
  }

  // Utility methods for common operations
  async getBalance(address: string, tokenAddress?: string) {
    // Implementation for getting balance
    // This would use the ERC20 contract or native ETH balance
  }

  async estimateFee(contractCall: any) {
    if (!this.account) {
      throw new Error('No account connected');
    }

    try {
      const fee = await this.account.estimateInvokeFee(contractCall);
      return fee;
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      throw error;
    }
  }

  async executeTransaction(contractCall: any) {
    if (!this.account) {
      throw new Error('No account connected');
    }

    try {
      const result = await this.account.execute(contractCall);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(txHash: string) {
    return await this.provider.waitForTransaction(txHash);
  }
}

// Singleton instance
export const starknetService = new StarknetService();