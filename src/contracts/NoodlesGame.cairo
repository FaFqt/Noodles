// Example Starknet contract for Noodles Game
// This is a Cairo contract that would be compiled and deployed

use starknet::ContractAddress;

#[starknet::interface]
pub trait INoodlesGame<TContractState> {
    // View functions
    fn get_player_score(self: @TContractState, player: ContractAddress) -> u256;
    fn get_game_state(self: @TContractState) -> GameState;

    // External functions
    fn start_game(ref self: TContractState);
    fn complete_order(ref self: TContractState, order_id: u256, quality: u8);
    fn claim_reward(ref self: TContractState, reward_type: RewardType);
}

#[derive(Drop, Serde, starknet::Store)]
pub struct GameState {
    pub total_players: u256,
    pub total_orders_completed: u256,
    pub is_active: bool,
}

#[derive(Drop, Serde)]
pub enum RewardType {
    Coins,
    Experience,
    SpecialItem,
}

#[starknet::contract]
pub mod NoodlesGame {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        // Player data
        player_scores: LegacyMap<ContractAddress, u256>,
        player_levels: LegacyMap<ContractAddress, u8>,
        player_coins: LegacyMap<ContractAddress, u256>,

        // Game state
        game_state: GameState,
        order_counter: u256,

        // Admin
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        OrderCompleted: OrderCompleted,
        PlayerLeveledUp: PlayerLeveledUp,
        RewardClaimed: RewardClaimed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OrderCompleted {
        #[key]
        pub player: ContractAddress,
        pub order_id: u256,
        pub quality: u8,
        pub reward: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PlayerLeveledUp {
        #[key]
        pub player: ContractAddress,
        pub new_level: u8,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RewardClaimed {
        #[key]
        pub player: ContractAddress,
        pub reward_type: RewardType,
        pub amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.game_state.write(GameState {
            total_players: 0,
            total_orders_completed: 0,
            is_active: true,
        });
        self.order_counter.write(0);
    }

    #[abi(embed_v0)]
    impl NoodlesGameImpl of super::INoodlesGame<ContractState> {
        fn get_player_score(self: @ContractState, player: ContractAddress) -> u256 {
            self.player_scores.read(player)
        }

        fn get_game_state(self: @ContractState) -> GameState {
            self.game_state.read()
        }

        fn start_game(ref self: ContractState) {
            let player = get_caller_address();
            let current_score = self.player_scores.read(player);

            // Initialize player if new
            if current_score.is_zero() {
                let mut state = self.game_state.read();
                state.total_players += 1;
                self.game_state.write(state);
            }
        }

        fn complete_order(ref self: ContractState, order_id: u256, quality: u8) {
            let player = get_caller_address();

            // Calculate reward based on quality (1-5 stars)
            let base_reward = 50;
            let quality_multiplier = quality.into();
            let reward = base_reward * quality_multiplier;

            // Update player stats
            let current_score = self.player_scores.read(player);
            self.player_scores.write(player, current_score + reward);

            let current_coins = self.player_coins.read(player);
            self.player_coins.write(player, current_coins + reward);

            // Update game state
            let mut state = self.game_state.read();
            state.total_orders_completed += 1;
            self.game_state.write(state);

            // Check for level up (every 1000 points)
            let new_score = current_score + reward;
            let current_level = self.player_levels.read(player);
            let new_level = (new_score / 1000).try_into().unwrap();

            if new_level > current_level {
                self.player_levels.write(player, new_level);
                self.emit(PlayerLeveledUp { player, new_level });
            }

            // Emit completion event
            self.emit(OrderCompleted { player, order_id, quality, reward });
        }

        fn claim_reward(ref self: ContractState, reward_type: RewardType) {
            let player = get_caller_address();

            match reward_type {
                RewardType::Coins => {
                    let coins = self.player_coins.read(player);
                    // Transfer coins logic would go here
                    self.player_coins.write(player, 0);
                    self.emit(RewardClaimed { player, reward_type, amount: coins });
                },
                RewardType::Experience => {
                    let score = self.player_scores.read(player);
                    // Experience claim logic
                    self.emit(RewardClaimed { player, reward_type, amount: score });
                },
                RewardType::SpecialItem => {
                    // Special item claim logic
                    self.emit(RewardClaimed { player, reward_type, amount: 1 });
                },
            }
        }
    }
}