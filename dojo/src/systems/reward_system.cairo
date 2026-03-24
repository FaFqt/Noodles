#[starknet::interface]
pub trait IRewardSystem<TContractState> {
    fn grant_test_noods(ref self: TContractState, amount: u128);
    fn grant_seed(ref self: TContractState, crop_type: u8, amount: u32);
    fn claim_daily_reward(ref self: TContractState, day_index: u32);
}

#[dojo::contract]
pub mod reward_system {
    use super::IRewardSystem;
    use noodles_dojo::models::{DailyProgress, PlayerInventory, PlayerProfile};
    use noodles_dojo::utils::constants::{CROP_CORN, CROP_DRAGONPEPPER, CROP_MOONHERB};
    use noodles_dojo::utils::errors::{
        DAILY_REWARD_ALREADY_CLAIMED, PLAYER_NOT_REGISTERED,
    };
    use starknet::{ContractAddress, get_caller_address};
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct RewardGranted {
        #[key]
        pub player: ContractAddress,
        pub reward_type: felt252,
        pub amount: u128,
    }

    fn assert_registered(world: @dojo::world::WorldStorage, player: ContractAddress) {
        let profile: PlayerProfile = world.read_model(player);
        assert(profile.created_at != 0, PLAYER_NOT_REGISTERED);
    }

    #[abi(embed_v0)]
    impl RewardSystemImpl of IRewardSystem<ContractState> {
        fn grant_test_noods(ref self: ContractState, amount: u128) {
            let mut world = self.world_default();
            let player = get_caller_address();
            assert_registered(@world, player);

            let mut inventory: PlayerInventory = world.read_model(player);
            inventory.noods_balance += amount;
            world.write_model(@inventory);

            world.emit_event(@RewardGranted { player, reward_type: 'noods', amount });
        }

        fn grant_seed(ref self: ContractState, crop_type: u8, amount: u32) {
            let mut world = self.world_default();
            let player = get_caller_address();
            assert_registered(@world, player);

            let mut inventory: PlayerInventory = world.read_model(player);

            if crop_type == CROP_CORN {
                inventory.corn_seed += amount;
            } else if crop_type == CROP_DRAGONPEPPER {
                inventory.dragonpepper_seed += amount;
            } else if crop_type == CROP_MOONHERB {
                inventory.moonherb_seed += amount;
            };

            world.write_model(@inventory);
            world.emit_event(
                @RewardGranted { player, reward_type: 'seed', amount: amount.into() }
            );
        }

        fn claim_daily_reward(ref self: ContractState, day_index: u32) {
            let mut world = self.world_default();
            let player = get_caller_address();
            assert_registered(@world, player);

            let mut progress: DailyProgress = world.read_model(player);
            let mut inventory: PlayerInventory = world.read_model(player);

            assert(
                !(progress.day_index == day_index && progress.claimed_daily_reward),
                DAILY_REWARD_ALREADY_CLAIMED
            );

            progress.day_index = day_index;
            progress.claimed_daily_reward = true;
            progress.services_completed = 0;
            inventory.noods_balance += 10;

            world.write_model(@progress);
            world.write_model(@inventory);
            world.emit_event(@RewardGranted { player, reward_type: 'daily', amount: 10 });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"noodles")
        }
    }
}
