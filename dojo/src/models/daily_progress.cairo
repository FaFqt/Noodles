use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct DailyProgress {
    #[key]
    pub player: ContractAddress,
    pub day_index: u32,
    pub services_completed: u8,
    pub claimed_daily_reward: bool,
}
