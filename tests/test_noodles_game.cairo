use snforge_std::{declare, ContractClassTrait, start_prank, stop_prank};
use starknet::{ContractAddress, contract_address_const};

use noodles_game::INoodlesGameDispatcher;
use noodles_game::INoodlesGameDispatcherTrait;

fn deploy_contract() -> ContractAddress {
    let contract = declare("NoodlesGame");
    let owner = contract_address_const::<'owner'>();
    let contract_address = contract.deploy(@array![owner.into()]).unwrap();
    contract_address
}

#[test]
fn test_start_game() {
    let contract_address = deploy_contract();
    let dispatcher = INoodlesGameDispatcher { contract_address };

    let player = contract_address_const::<'player'>();

    // Start prank to simulate player calling the function
    start_prank(contract_address, player);

    dispatcher.start_game();

    // Check that player score is initialized
    let score = dispatcher.get_player_score(player);
    assert(score == 0, 'Score should be 0 initially');

    stop_prank(contract_address);
}

#[test]
fn test_complete_order() {
    let contract_address = deploy_contract();
    let dispatcher = INoodlesGameDispatcher { contract_address };

    let player = contract_address_const::<'player'>();

    // Start game first
    start_prank(contract_address, player);
    dispatcher.start_game();

    // Complete an order with 5-star quality
    let order_id = 1;
    let quality = 5;
    dispatcher.complete_order(order_id, quality);

    // Check that player score increased (50 * 5 = 250)
    let score = dispatcher.get_player_score(player);
    assert(score == 250, 'Score should be 250 after 5-star order');

    stop_prank(contract_address);
}

#[test]
fn test_level_up() {
    let contract_address = deploy_contract();
    let dispatcher = INoodlesGameDispatcher { contract_address };

    let player = contract_address_const::<'player'>();

    start_prank(contract_address, player);
    dispatcher.start_game();

    // Complete multiple high-quality orders to reach level 2
    let mut i = 0;
    while i < 4 {
        dispatcher.complete_order(i.into(), 5); // 250 points each
        i += 1;
    };

    // Should have 1000 points and level 2
    let score = dispatcher.get_player_score(player);
    assert(score == 1000, 'Score should be 1000');

    stop_prank(contract_address);
}

#[test]
fn test_game_state_tracking() {
    let contract_address = deploy_contract();
    let dispatcher = INoodlesGameDispatcher { contract_address };

    let player1 = contract_address_const::<'player1'>();
    let player2 = contract_address_const::<'player2'>();

    // Player 1 starts game
    start_prank(contract_address, player1);
    dispatcher.start_game();
    stop_prank(contract_address);

    // Player 2 starts game
    start_prank(contract_address, player2);
    dispatcher.start_game();
    dispatcher.complete_order(1, 3); // 150 points
    stop_prank(contract_address);

    // Check game state
    let game_state = dispatcher.get_game_state();
    assert(game_state.total_players == 2, 'Should have 2 players');
    assert(game_state.total_orders_completed == 1, 'Should have 1 completed order');
    assert(game_state.is_active == true, 'Game should be active');
}