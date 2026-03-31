use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerUnlocks {
    #[key]
    pub player: ContractAddress,
    pub tip_jar_unlocked: bool,
    pub greenhouse_unlocked: bool,
    pub market_unlocked: bool,
    pub ingredient_inventory_ready: bool,
}
