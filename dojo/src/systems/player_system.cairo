use starknet::ContractAddress;
use noodles_dojo::models::PlayerProgress;

#[starknet::interface]
pub trait IPlayerSystem<TContractState> {
    fn is_player_registered(self: @TContractState, player: ContractAddress) -> bool;
    fn get_player_progress(self: @TContractState, player: ContractAddress) -> PlayerProgress;
    fn register_player(ref self: TContractState, username: felt252);
    fn touch_login(ref self: TContractState);
    fn sync_player_progress(
        ref self: TContractState, level: u32, xp: u32, xp_to_next: u32, noods_balance: u128,
    );
    fn reset_player_progress_for_dev(ref self: TContractState);
}

#[dojo::contract]
pub mod player_system {
    use super::IPlayerSystem;
    use noodles_dojo::models::{
        DailyProgress, PlayerInventory, PlayerProfile, PlayerProgress, PlayerUnlocks,
    };
    use noodles_dojo::utils::errors::{
        PLAYER_ALREADY_REGISTERED, PLAYER_NOT_REGISTERED,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerRegistered {
        #[key]
        pub player: ContractAddress,
        pub username: felt252,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerLoginTouched {
        #[key]
        pub player: ContractAddress,
        pub last_login_at: u64,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerProgressSynced {
        #[key]
        pub player: ContractAddress,
        pub level: u32,
        pub xp: u32,
        pub xp_to_next: u32,
        pub noods_balance: u128,
        pub updated_at: u64,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerProgressResetForDev {
        #[key]
        pub player: ContractAddress,
        pub updated_at: u64,
    }

    #[abi(embed_v0)]
    impl PlayerSystemImpl of IPlayerSystem<ContractState> {
        fn is_player_registered(self: @ContractState, player: ContractAddress) -> bool {
            let world = self.world_default();
            let profile: PlayerProfile = world.read_model(player);
            profile.created_at != 0
        }

        fn get_player_progress(self: @ContractState, player: ContractAddress) -> PlayerProgress {
            let world = self.world_default();
            world.read_model(player)
        }

        fn register_player(ref self: ContractState, username: felt252) {
            let mut world = self.world_default();
            let player = get_caller_address();
            let existing: PlayerProfile = world.read_model(player);

            assert(existing.created_at == 0, PLAYER_ALREADY_REGISTERED);

            let now = get_block_timestamp();

            world.write_model(
                @PlayerProfile {
                    player,
                    username,
                    created_at: now,
                    last_login_at: now,
                }
            );

            world.write_model(
                @PlayerUnlocks {
                    player,
                    tip_jar_unlocked: false,
                    greenhouse_unlocked: false,
                    market_unlocked: false,
                }
            );

            world.write_model(
                @PlayerInventory {
                    player,
                    noods_balance: 10,
                    corn_seed: 0,
                    dragonpepper_seed: 0,
                    moonherb_seed: 0,
                    crystal_salt: 0,
                }
            );

            world.write_model(
                @PlayerProgress {
                    player,
                    level: 1,
                    xp: 0,
                    xp_to_next: 100,
                    updated_at: now,
                }
            );

            world.emit_event(@PlayerRegistered { player, username });
        }

        fn touch_login(ref self: ContractState) {
            let mut world = self.world_default();
            let player = get_caller_address();
            let mut profile: PlayerProfile = world.read_model(player);
            let now = get_block_timestamp();

            assert(profile.created_at != 0, PLAYER_NOT_REGISTERED);

            profile.last_login_at = now;

            world.write_model(@profile);
            world.emit_event(@PlayerLoginTouched { player, last_login_at: now });
        }

        fn sync_player_progress(
            ref self: ContractState, level: u32, xp: u32, xp_to_next: u32, noods_balance: u128,
        ) {
            let mut world = self.world_default();
            let player = get_caller_address();
            let profile: PlayerProfile = world.read_model(player);
            let mut inventory: PlayerInventory = world.read_model(player);
            let now = get_block_timestamp();

            assert(profile.created_at != 0, PLAYER_NOT_REGISTERED);

            inventory.noods_balance = noods_balance;

            world.write_model(@inventory);
            world.write_model(
                @PlayerProgress {
                    player,
                    level,
                    xp,
                    xp_to_next,
                    updated_at: now,
                }
            );

            world.emit_event(
                @PlayerProgressSynced {
                    player,
                    level,
                    xp,
                    xp_to_next,
                    noods_balance,
                    updated_at: now,
                }
            );
        }

        fn reset_player_progress_for_dev(ref self: ContractState) {
            let mut world = self.world_default();
            let player = get_caller_address();
            let profile: PlayerProfile = world.read_model(player);
            let now = get_block_timestamp();

            assert(profile.created_at != 0, PLAYER_NOT_REGISTERED);

            world.write_model(
                @PlayerProgress {
                    player,
                    level: 1,
                    xp: 0,
                    xp_to_next: 100,
                    updated_at: now,
                }
            );

            world.write_model(
                @PlayerInventory {
                    player,
                    noods_balance: 10,
                    corn_seed: 0,
                    dragonpepper_seed: 0,
                    moonherb_seed: 0,
                    crystal_salt: 0,
                }
            );

            world.write_model(
                @PlayerUnlocks {
                    player,
                    tip_jar_unlocked: false,
                    greenhouse_unlocked: false,
                    market_unlocked: false,
                }
            );

            world.write_model(
                @DailyProgress {
                    player,
                    day_index: 0,
                    services_completed: 0,
                    claimed_daily_reward: false,
                }
            );

            world.emit_event(@PlayerProgressResetForDev { player, updated_at: now });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"noodles")
        }
    }
}
