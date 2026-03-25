use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerProgress {
    #[key]
    pub player: ContractAddress,
    pub level: u32,
    pub xp: u32,
    pub xp_to_next: u32,
    pub updated_at: u64,
}
