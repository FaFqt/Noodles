use starknet::ContractAddress;
use noodles_dojo::models::{PlayerInventory, PlayerProgress, PlayerUnlocks};

#[starknet::interface]
pub trait IPlayerSystem<TContractState> {
    fn is_player_registered(self: @TContractState, player: ContractAddress) -> bool;
    fn get_player_progress(self: @TContractState, player: ContractAddress) -> PlayerProgress;
    fn get_player_inventory(self: @TContractState, player: ContractAddress) -> PlayerInventory;
    fn get_player_unlocks(self: @TContractState, player: ContractAddress) -> PlayerUnlocks;
    fn register_player(ref self: TContractState, username: felt252);
    fn touch_login(ref self: TContractState);
    fn sync_player_progress(
        ref self: TContractState, level: u32, xp: u32, xp_to_next: u32, noods_balance: u128,
    );
    fn sync_ingredient_inventory(
        ref self: TContractState,
        corn: u32,
        bamboo: u32,
        mushroom: u32,
        garlic: u32,
        egg: u32,
        pork: u32,
        chicken: u32,
        tofu: u32,
        shrimp: u32,
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
    pub struct IngredientInventorySynced {
        #[key]
        pub player: ContractAddress,
        pub corn: u32,
        pub bamboo: u32,
        pub mushroom: u32,
        pub garlic: u32,
        pub egg: u32,
        pub pork: u32,
        pub chicken: u32,
        pub tofu: u32,
        pub shrimp: u32,
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

        fn get_player_inventory(self: @ContractState, player: ContractAddress) -> PlayerInventory {
            let world = self.world_default();
            world.read_model(player)
        }

        fn get_player_unlocks(self: @ContractState, player: ContractAddress) -> PlayerUnlocks {
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
                    ingredient_inventory_ready: false,
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
                    corn: 0,
                    bamboo: 0,
                    mushroom: 0,
                    garlic: 0,
                    egg: 0,
                    pork: 0,
                    chicken: 0,
                    tofu: 0,
                    shrimp: 0,
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

        fn sync_ingredient_inventory(
            ref self: ContractState,
            corn: u32,
            bamboo: u32,
            mushroom: u32,
            garlic: u32,
            egg: u32,
            pork: u32,
            chicken: u32,
            tofu: u32,
            shrimp: u32,
        ) {
            let mut world = self.world_default();
            let player = get_caller_address();
            let profile: PlayerProfile = world.read_model(player);
            let mut inventory: PlayerInventory = world.read_model(player);
            let mut unlocks: PlayerUnlocks = world.read_model(player);
            let now = get_block_timestamp();

            assert(profile.created_at != 0, PLAYER_NOT_REGISTERED);

            inventory.corn = corn;
            inventory.bamboo = bamboo;
            inventory.mushroom = mushroom;
            inventory.garlic = garlic;
            inventory.egg = egg;
            inventory.pork = pork;
            inventory.chicken = chicken;
            inventory.tofu = tofu;
            inventory.shrimp = shrimp;
            unlocks.ingredient_inventory_ready = true;

            world.write_model(@inventory);
            world.write_model(@unlocks);
            world.emit_event(
                @IngredientInventorySynced {
                    player,
                    corn,
                    bamboo,
                    mushroom,
                    garlic,
                    egg,
                    pork,
                    chicken,
                    tofu,
                    shrimp,
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
                    corn: 0,
                    bamboo: 0,
                    mushroom: 0,
                    garlic: 0,
                    egg: 0,
                    pork: 0,
                    chicken: 0,
                    tofu: 0,
                    shrimp: 0,
                }
            );

            world.write_model(
                @PlayerUnlocks {
                    player,
                    tip_jar_unlocked: false,
                    greenhouse_unlocked: false,
                    market_unlocked: false,
                    ingredient_inventory_ready: false,
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
