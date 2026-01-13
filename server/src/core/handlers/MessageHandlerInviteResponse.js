    /**
     * Handle INVITE_RESPONSE - invitee accepts/declines invite
     */
    async handleInviteResponse(clientId, packet) {
    const { accepted, inviterId, mode } = packet;

    // Find inviter's client
    let inviterClient = null;
    for (const [cid, c] of this.server.clients) {
        if (c.userId && c.userId.toString() === inviterId) {
            inviterClient = c;
            break;
        }
    }

    if (!inviterClient) {
        console.log('[handleInviteResponse] Inviter not found or offline');
        return;
    }

    if (accepted) {
        // Generate unique room ID for this 1v1 match
        const roomId = `${inviterId}_${Date.now()}`;

        // Send acceptance notification to inviter
        this.server.sendToClient(inviterClient.id, {
            type: PacketType.INVITE_ACCEPTED,
            mode: mode,
            roomId: roomId
        });

        console.log(`[handleInviteResponse] Invite accepted. Room: ${roomId}`);
    } else {
        // Send decline notification to inviter
        this.server.sendToClient(inviterClient.id, {
            type: PacketType.INVITE_DECLINED
        });

        console.log('[handleInviteResponse] Invite declined');
    }
}
