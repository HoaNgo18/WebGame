export const PacketType = {
    // Client -> Server
    JOIN: 'join',
    INPUT: 'input',
    ATTACK: 'attack',
    SELECT_SLOT: 'select_slot',
    USE_ITEM: 'use_item',

    // Server -> Client
    INIT: 'init',
    UPDATE: 'update',
    PLAYER_JOIN: 'player_join',
    PLAYER_LEAVE: 'player_leave',
    PLAYER_DIED: 'player_died',
};
