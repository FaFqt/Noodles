pub const NAMESPACE: felt252 = 'noodles';

pub const CROP_NONE: u8 = 0;
pub const CROP_CORN: u8 = 1;
pub const CROP_DRAGONPEPPER: u8 = 2;
pub const CROP_MOONHERB: u8 = 3;

pub const STAGE_EMPTY: u8 = 0;
pub const STAGE_GROWING: u8 = 1;
pub const STAGE_READY: u8 = 2;

pub const CORN_GROWTH_SECONDS: u64 = 4 * 60 * 60;
pub const DRAGONPEPPER_GROWTH_SECONDS: u64 = 8 * 60 * 60;
pub const MOONHERB_GROWTH_SECONDS: u64 = 12 * 60 * 60;

pub fn crop_growth_time(crop_type: u8) -> u64 {
    if crop_type == CROP_CORN {
        return CORN_GROWTH_SECONDS;
    };

    if crop_type == CROP_DRAGONPEPPER {
        return DRAGONPEPPER_GROWTH_SECONDS;
    };

    if crop_type == CROP_MOONHERB {
        return MOONHERB_GROWTH_SECONDS;
    };

    0
}
