// roblox-player-detailed.js
class RobloxPlayerFetcher {
    constructor() {
        this.baseUrl = 'https://users.roblox.com/v1';
    }

    async fetchWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    async getBasicInfo(userId) {
        return this.fetchWithRetry(`${this.baseUrl}/users/${userId}`);
    }

    async getPresence(userId) {
        try {
            const response = await fetch(`https://presence.roblox.com/v1/presence/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIds: [userId] })
            });
            return await response.json();
        } catch (error) {
            return { userPresences: [{}] };
        }
    }

    async getPlayerInfo(userId) {
        try {
            const [basicInfo, presenceInfo] = await Promise.all([
                this.getBasicInfo(userId),
                this.getPresence(userId)
            ]);

            const presence = presenceInfo.userPresences?.[0] || {};

            return {
                id: basicInfo.id,
                name: basicInfo.name,
                displayName: basicInfo.displayName,
                description: basicInfo.description,
                created: new Date(basicInfo.created).toLocaleDateString(),
                isBanned: basicInfo.isBanned,
                hasVerifiedBadge: basicInfo.hasVerifiedBadge,
                lastOnline: presence.lastOnline ? new Date(presence.lastOnline).toLocaleString() : 'Unknown',
                presence: presence.userPresenceType || 'Offline',
                placeId: presence.placeId || null,
                gameId: presence.universeId || null
            };
        } catch (error) {
            console.error(`Error fetching detailed info for user ${userId}:`, error);
            return null;
        }
    }
}

// Usage example
async function main() {
    const fetcher = new RobloxPlayerFetcher();
    
    // Test with some user IDs
    const testUserIds = [1, 261, 156, 12345]; // Replace with actual user IDs
    
    for (const userId of testUserIds) {
        console.log(`\n=== Fetching info for User ID: ${userId} ===`);
        
        const playerInfo = await fetcher.getPlayerInfo(userId);
        
        if (playerInfo) {
            console.log('📋 Player Information:');
            console.log(`   Name: ${playerInfo.name}`);
            console.log(`   Display Name: ${playerInfo.displayName}`);
            console.log(`   User ID: ${playerInfo.id}`);
            console.log(`   Description: ${playerInfo.description?.substring(0, 50) || 'No description'}...`);
            console.log(`   Created: ${playerInfo.created}`);
            console.log(`   Status: ${playerInfo.presence}`);
            console.log(`   Last Online: ${playerInfo.lastOnline}`);
            console.log(`   Verified: ${playerInfo.hasVerifiedBadge ? '✅' : '❌'}`);
            console.log(`   Banned: ${playerInfo.isBanned ? '🔴' : '🟢'}`);
        } else {
            console.log('❌ Failed to fetch player information');
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Run the script
main().catch(console.error);
