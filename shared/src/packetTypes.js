export const PacketType = {
    // Client -> Server
    JOIN: 'join',
    INPUT: 'input',
    ATTACK: 'attack',
    SELECT_SLOT: 'select_slot',
    USE_ITEM: 'use_item',
    JOIN_ARENA: 'join_arena',
    LEAVE_ARENA: 'leave_arena',

    // Server -> Client
    INIT: 'init',
    UPDATE: 'update',
    PLAYER_JOIN: 'player_join',
    PLAYER_LEAVE: 'player_leave',
    PLAYER_DIED: 'player_died',

    // Arena events
    ARENA_STATE: 'arena_state',
    ARENA_COUNTDOWN: 'arena_countdown',
    ARENA_START: 'arena_start',
    ARENA_ZONE_UPDATE: 'arena_zone_update',
    ARENA_PLAYER_ELIMINATED: 'arena_player_eliminated',
    ARENA_END: 'arena_end',
    ARENA_LEADERBOARD: 'arena_leaderboard',
};
