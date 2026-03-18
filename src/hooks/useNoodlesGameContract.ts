import { starknetService } from '../services/starknetService';

export const useNoodlesGameContract = () => {
  const completeOrder = async (orderId: string, quality: number) => {
    try {
      const contract = starknetService.getConnectedContract('NOODLES_GAME');

      // Convert orderId to u256 and quality to u8
      const orderIdU256 = BigInt(orderId);
      const qualityU8 = quality;

      const result = await starknetService.executeTransaction([
        contract.populate('complete_order', [orderIdU256, qualityU8])
      ]);

      await starknetService.waitForTransaction(result.transaction_hash);
      return result;
    } catch (error) {
      console.error('Failed to complete order:', error);
      throw error;
    }
  };

  const getPlayerScore = async (playerAddress: string) => {
    try {
      const contract = starknetService.getContract('NOODLES_GAME');
      const score = await contract.get_player_score(playerAddress);
      return score.toString();
    } catch (error) {
      console.error('Failed to get player score:', error);
      throw error;
    }
  };

  const startGame = async () => {
    try {
      const contract = starknetService.getConnectedContract('NOODLES_GAME');

      const result = await starknetService.executeTransaction([
        contract.populate('start_game', [])
      ]);

      await starknetService.waitForTransaction(result.transaction_hash);
      return result;
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  };

  const claimReward = async (rewardType: 'Coins' | 'Experience' | 'SpecialItem') => {
    try {
      const contract = starknetService.getConnectedContract('NOODLES_GAME');

      // Map string to enum value (this would need to match your contract's enum)
      const rewardTypeEnum = rewardType === 'Coins' ? 0 : rewardType === 'Experience' ? 1 : 2;

      const result = await starknetService.executeTransaction([
        contract.populate('claim_reward', [rewardTypeEnum])
      ]);

      await starknetService.waitForTransaction(result.transaction_hash);
      return result;
    } catch (error) {
      console.error('Failed to claim reward:', error);
      throw error;
    }
  };

  return {
    completeOrder,
    getPlayerScore,
    startGame,
    claimReward,
  };
};