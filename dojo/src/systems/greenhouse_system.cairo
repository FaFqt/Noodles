#[starknet::interface]
pub trait IGreenhouseSystem<TContractState> {
    fn plant_seed(ref self: TContractState, plot_id: u8, crop_type: u8);
    fn harvest_crop(ref self: TContractState, plot_id: u8);
}

#[dojo::contract]
pub mod greenhouse_system {
    use super::IGreenhouseSystem;
    use noodles_dojo::models::{GreenhousePlot, PlayerInventory, PlayerProfile, PlayerUnlocks};
    use noodles_dojo::utils::constants::{
        CROP_CORN, CROP_DRAGONPEPPER, CROP_MOONHERB, CROP_NONE, STAGE_EMPTY, STAGE_GROWING,
        crop_growth_time,
    };
    use noodles_dojo::utils::errors::{
        GREENHOUSE_LOCKED, INSUFFICIENT_SEEDS, PLAYER_NOT_REGISTERED, PLOT_ALREADY_ACTIVE,
        PLOT_NOT_ACTIVE, PLOT_NOT_READY,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct SeedPlanted {
        #[key]
        pub player: ContractAddress,
        pub plot_id: u8,
        pub crop_type: u8,
        pub ready_at: u64,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct CropHarvested {
        #[key]
        pub player: ContractAddress,
        pub plot_id: u8,
        pub crop_type: u8,
        pub amount: u32,
    }

    fn assert_registered(world: @dojo::world::WorldStorage, player: ContractAddress) {
        let profile: PlayerProfile = world.read_model(player);
        assert(profile.created_at != 0, PLAYER_NOT_REGISTERED);
    }

    #[abi(embed_v0)]
    impl GreenhouseSystemImpl of IGreenhouseSystem<ContractState> {
        fn plant_seed(ref self: ContractState, plot_id: u8, crop_type: u8) {
            let mut world = self.world_default();
            let player = get_caller_address();
            assert_registered(@world, player);

            let unlocks: PlayerUnlocks = world.read_model(player);
            assert(unlocks.greenhouse_unlocked, GREENHOUSE_LOCKED);

            let mut inventory: PlayerInventory = world.read_model(player);
            let current_plot: GreenhousePlot = world.read_model((player, plot_id));

            assert(!current_plot.is_active, PLOT_ALREADY_ACTIVE);

            if crop_type == CROP_CORN {
                assert(inventory.corn_seed > 0, INSUFFICIENT_SEEDS);
                inventory.corn_seed -= 1;
            } else if crop_type == CROP_DRAGONPEPPER {
                assert(inventory.dragonpepper_seed > 0, INSUFFICIENT_SEEDS);
                inventory.dragonpepper_seed -= 1;
            } else if crop_type == CROP_MOONHERB {
                assert(inventory.moonherb_seed > 0, INSUFFICIENT_SEEDS);
                inventory.moonherb_seed -= 1;
            } else {
                assert(false, INSUFFICIENT_SEEDS);
            };

            let now = get_block_timestamp();
            let ready_at = now + crop_growth_time(crop_type);

            world.write_model(@inventory);
            world.write_model(
                @GreenhousePlot {
                    player,
                    plot_id,
                    crop_type,
                    stage: STAGE_GROWING,
                    planted_at: now,
                    ready_at,
                    is_active: true,
                }
            );

            world.emit_event(@SeedPlanted { player, plot_id, crop_type, ready_at });
        }

        fn harvest_crop(ref self: ContractState, plot_id: u8) {
            let mut world = self.world_default();
            let player = get_caller_address();
            assert_registered(@world, player);

            let mut plot: GreenhousePlot = world.read_model((player, plot_id));
            assert(plot.is_active, PLOT_NOT_ACTIVE);

            let now = get_block_timestamp();
            assert(now >= plot.ready_at, PLOT_NOT_READY);

            let mut inventory: PlayerInventory = world.read_model(player);

            if plot.crop_type == CROP_CORN {
                inventory.corn_seed += 1;
            } else if plot.crop_type == CROP_DRAGONPEPPER {
                inventory.dragonpepper_seed += 1;
            } else if plot.crop_type == CROP_MOONHERB {
                inventory.moonherb_seed += 1;
            };

            let harvested_crop = plot.crop_type;
            plot.crop_type = CROP_NONE;
            plot.stage = STAGE_EMPTY;
            plot.planted_at = 0;
            plot.ready_at = 0;
            plot.is_active = false;

            world.write_model(@inventory);
            world.write_model(@plot);
            world.emit_event(
                @CropHarvested { player, plot_id, crop_type: harvested_crop, amount: 1 }
            );
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"noodles")
        }
    }
}
