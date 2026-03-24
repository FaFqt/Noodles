use starknet::ContractAddress;

#[starknet::interface]
pub trait IPlayerSystem<TContractState> {
    fn is_player_registered(self: @TContractState, player: ContractAddress) -> bool;
    fn register_player(ref self: TContractState, username: felt252);
    fn touch_login(ref self: TContractState);
}

#[dojo::contract]
pub mod player_system {
    use super::IPlayerSystem;
    use noodles_dojo::models::{PlayerInventory, PlayerProfile, PlayerUnlocks};
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

    #[abi(embed_v0)]
    impl PlayerSystemImpl of IPlayerSystem<ContractState> {
        fn is_player_registered(self: @ContractState, player: ContractAddress) -> bool {
            let world = self.world_default();
            let profile: PlayerProfile = world.read_model(player);
            profile.created_at != 0
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
                    noods_balance: 0,
                    corn_seed: 0,
                    dragonpepper_seed: 0,
                    moonherb_seed: 0,
                    crystal_salt: 0,
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
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"noodles")
        }
    }
}
