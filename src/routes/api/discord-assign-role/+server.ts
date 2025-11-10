import type { RequestHandler } from "./$types";
import { Client, GatewayIntentBits } from 'discord.js';

const DISCORD_BOT_TOKEN = import.meta.env.VITE_DISCORD_BOT_TOKEN; 


export const GET: RequestHandler = async ({  locals }) => {
  // Parse incoming data
  const { pb, user } = locals;




  // Check if user is authenticated
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "User not authenticated" }), { status: 401 });
  }

  try {
    
    const userDiscordId = (await pb.collection('users')?.listExternalAuths(pb?.authStore?.model?.id))?.find(item => item?.provider === 'discord')?.providerId;



    // Check if user has Discord ID from OAuth2
    if (!userDiscordId) {
        console.log("Discord ID not found for")
      return new Response(JSON.stringify({ error: "Discord ID not found for user" }), { status: 400 });
    }

    // Determine user tier (Pro or Free)
    const tier = user?.tier === "Pro" ? "Pro" : "Free";
    
    // Initialize Discord bot
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
      ]
    });

    // Login to Discord
    await client.login(DISCORD_BOT_TOKEN);

    let assignmentResults: string[] = [];
    let hasErrors = false;

    // Wait for bot to be ready
    await new Promise<void>((resolve) => {
      client.once('ready', () => {
        console.log(`Discord bot logged in as ${client.user?.tag}`);
        resolve();
      });
    });

    // Process all guilds the bot is in
    for (const guild of client.guilds.cache.values()) {
      try {
        // Get Pro role
        const proRole = guild.roles.cache.find(role => role.name === "Pro");
        
        if (!proRole) {
          console.warn(`Pro role not found in guild: ${guild.name}`);
          continue;
        }

        // Try to get the member
        let member;
        try {
          member = await guild.members.fetch(userDiscordId);
        } catch (fetchError) {
          console.log(`User ${userDiscordId} not found in guild: ${guild.name}`);
          continue; // User not in this guild, skip
        }

        // Handle role assignment based on tier
        if (tier === "Pro") {
          // Add Pro role if they don't have it
          if (!member.roles.cache.has(proRole.id)) {
            await member.roles.add(proRole);
            assignmentResults.push(`Added Pro role in ${guild.name}`);
            console.log(`Added Pro role to ${member.displayName} in ${guild.name}`);
          } else {
            assignmentResults.push(`Already has Pro role in ${guild.name}`);
            console.log(`User ${member.displayName} already has Pro role in ${guild.name}`);
          }

          await pb?.collection('users')?.update(user?.id, {
            discord: {'access': true, id: userDiscordId}
          });

        } else {
          // tier === "Free" - Remove Pro role if they have it
          if (member.roles.cache.has(proRole.id)) {
            await member.roles.remove(proRole);
            assignmentResults.push(`Removed Pro role in ${guild.name}`);
            console.log(`Removed Pro role from ${member.displayName} in ${guild.name}`);
          } else {
            assignmentResults.push(`Already Free (no Pro role) in ${guild.name}`);
            console.log(`User ${member.displayName} already Free in ${guild.name}`);
          }
        }

      } catch (guildError) {
        console.error(`Error processing guild ${guild.name}:`, guildError);
        assignmentResults.push(`Error in ${guild.name}: ${guildError}`);
        hasErrors = true;
      }
    }

    // Close Discord connection
    await client.destroy();

    // Return results
    const output = hasErrors ? "partial_success" : "success";
    
    return new Response(JSON.stringify({ 
      status: output,
      tier: tier,
      discord_id: userDiscordId,
      results: assignmentResults,
      message: `Role assignment ${output} for ${tier} tier`
    }), { status: 200 });

  } catch (err) {
    console.error("Error in Discord role assignment:", err);
    
    // Make sure to close Discord connection on error
    try {
      const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
      });
      if (client.isReady()) {
        await client.destroy();
      }
    } catch (cleanupError) {
      console.error("Error cleaning up Discord connection:", cleanupError);
    }

    return new Response(JSON.stringify({ 
      error: "Server error during role assignment",
      details: err instanceof Error ? err.message : "Unknown error"
    }), { status: 500 });
  }
};