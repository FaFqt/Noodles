use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerInventory {
    #[key]
    pub player: ContractAddress,
    pub noods_balance: u128,
    pub corn_seed: u32,
    pub dragonpepper_seed: u32,
    pub moonherb_seed: u32,
    pub crystal_salt: u32,
}
