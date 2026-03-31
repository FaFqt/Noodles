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
    pub corn: u32,
    pub bamboo: u32,
    pub mushroom: u32,
    pub garlic: u32,
    pub egg: u32,
    pub pork: u32,
    pub chicken: u32,
    pub tofu: u32,
    pub shrimp: u32,
}
