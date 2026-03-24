use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerProfile {
    #[key]
    pub player: ContractAddress,
    pub username: felt252,
    pub created_at: u64,
    pub last_login_at: u64,
}
