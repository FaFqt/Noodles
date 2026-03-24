use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GreenhousePlot {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub plot_id: u8,
    pub crop_type: u8,
    pub stage: u8,
    pub planted_at: u64,
    pub ready_at: u64,
    pub is_active: bool,
}
