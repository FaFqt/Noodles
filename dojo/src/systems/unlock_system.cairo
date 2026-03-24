#[starknet::interface]
pub trait IUnlockSystem<TContractState> {
    fn claim_tip_jar_unlock(ref self: TContractState);
    fn claim_greenhouse_unlock(ref self: TContractState);
    fn claim_market_unlock(ref self: TContractState);
}

#[dojo::contract]
pub mod unlock_system {
    use super::IUnlockSystem;
    use noodles_dojo::models::{PlayerProfile, PlayerUnlocks};
    use noodles_dojo::utils::errors::{
        FEATURE_ALREADY_UNLOCKED, PLAYER_NOT_REGISTERED,
    };
    use starknet::{ContractAddress, get_caller_address};
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct FeatureUnlocked {
        #[key]
        pub player: ContractAddress,
        pub feature: felt252,
    }

    fn assert_registered(world: @dojo::world::WorldStorage, player: ContractAddress) {
        let profile: PlayerProfile = world.read_model(player);
        assert(profile.created_at != 0, PLAYER_NOT_REGISTERED);
    }

    #[abi(embed_v0)]
    impl UnlockSystemImpl of IUnlockSystem<ContractState> {
        fn claim_tip_jar_unlock(ref self: ContractState) {
            let mut world = self.world_default();
            let player = get_caller_address();
            assert_registered(@world, player);

            let mut unlocks: PlayerUnlocks = world.read_model(player);
            assert(!unlocks.tip_jar_unlocked, FEATURE_ALREADY_UNLOCKED);

            unlocks.tip_jar_unlocked = true;
            world.write_model(@unlocks);
            world.emit_event(@FeatureUnlocked { player, feature: 'tip_jar' });
        }

        fn claim_greenhouse_unlock(ref self: ContractState) {
            let mut world = self.world_default();
            let player = get_caller_address();
            assert_registered(@world, player);

            let mut unlocks: PlayerUnlocks = world.read_model(player);
            assert(!unlocks.greenhouse_unlocked, FEATURE_ALREADY_UNLOCKED);

            unlocks.greenhouse_unlocked = true;
            world.write_model(@unlocks);
            world.emit_event(@FeatureUnlocked { player, feature: 'greenhouse' });
        }

        fn claim_market_unlock(ref self: ContractState) {
            let mut world = self.world_default();
            let player = get_caller_address();
            assert_registered(@world, player);

            let mut unlocks: PlayerUnlocks = world.read_model(player);
            assert(!unlocks.market_unlocked, FEATURE_ALREADY_UNLOCKED);

            unlocks.market_unlocked = true;
            world.write_model(@unlocks);
            world.emit_event(@FeatureUnlocked { player, feature: 'market' });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"noodles")
        }
    }
}
