const { App } = require('@slack/bolt');
const fs = require('fs');

const SLACK_BOT_TOKEN = "xoxb-9275003207-1043695795191-J1tb8X1fsXDDnD0krEXSQlTE"
const SLACK_SIGNING_SECRET = "d705f25f5d2b821e7abefb114725a049"

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET
});

var channelArray = []
var membersArray = [];

// Fetch conversations using the conversations.list method
async function fetchConversations() {
  console.log("Getting all public slack channels,")
  console.log("can't access private channels, because they are")
  console.log("you know, private")

  try {
    // Call the conversations.list method using the built-in WebClient
    const result = await app.client.conversations.list({
      // The token you used to initialize your app
      token: SLACK_BOT_TOKEN,
      limit: 1000,
      exclude_archived: true,
      types: "public_channel,private_channel"
    });
    
    for (var i = 0; i < result.channels.length; i++) {
      var channel = {
        id: result.channels[i].id,
        name: result.channels[i].name,
        created: result.channels[i].created,
        creator: result.channels[i].creator,
        topic: result.channels[i].topic.value,
        purpose: result.channels[i].purpose.value,
        num_members: result.channels[i].num_members
      }

      console.log(channel)
      channelArray.push(channel);
    }
   fetchConoMembers(); 
  }
  catch (error) {
    console.error(error);
  }
}

async function fetchConoMembers() {
  console.log("Getting members in each Slack channel,")
  console.log("this might take a while, so hold tight")

  try {
    //for (var i = 0; i < channelArray.length; i++) {
    for (var i = 0; i < channelArray.length; i++) {  
      if (channelArray[i].num_members > 0) {
        // Call the conversations.members method using the built-in WebClient
        const result = await app.client.conversations.members({
          // The token you used to initialize your app
          token: SLACK_BOT_TOKEN,
          limit: 1000,
          channel: channelArray[i].id
        });
        console.log(i + " out of " + channelArray.length)
        console.log(channelArray[i].name + " members: ")
        console.log(result.members)
        channelArray[i].members = result.members
      }
    }
    console.log("done")
    fetchWorkspaceMembers();
  }
  catch (error) {
    console.error(error);
  }
}

async function fetchWorkspaceMembers() {
  console.log("Getting all the members in the workspace")
  console.log("because right now we just have the ID of every member in the slack channels")
  console.log("and not their name")
  try {
    // Call the conversations.list method using the built-in WebClient
    const result = await app.client.users.list({
      // The token you used to initialize your app
      token: SLACK_BOT_TOKEN
    });
    for (var i = 0; i < result.members.length; i++) {
      if (result.members[i].is_bot == false) {
          var member = {
          id: result.members[i].id,
          alias: result.members[i].name,
          name: result.members[i].real_name,
          admin: result.members[i].is_admin
        }
        membersArray.push(member)
      }
    }
    findMembersInChannels();
  }
  catch (error) {
    console.error(error);
  }
}

function findMembersInChannels() {
  console.log("finding members in group based on their ID")
  for (var i = 0; i < channelArray.length; i++) {
    console.log("name: " + channelArray[i].name)
    if (channelArray[i].hasOwnProperty("members")){
      console.log("num_members: " + channelArray[i].members.length)
      for (var e = 0; e < channelArray[i].members.length; e++) {
        for (var d = 0; d < membersArray.length; d++) {
          if (channelArray[i].members[e] == membersArray[d].id) {
            channelArray[i].members[e] = membersArray[d]
            console.log(channelArray[i].members[e].id + " is " + membersArray[d].alias)
          }
        }
      }
    }
  }
  writeToFile()
}

function writeToFile() {
  /*
  var channelObj = {};
  for (var i = 0; i < channelArray.length; i++) {
    channelObj[channelArray[i].name] = channelArray[i]
  }
  */
  var channelObj = {
    "name": "cluster",
    "channels": channelArray
  };
  
  let data = JSON.stringify(channelObj, null, 2);
  fs.writeFileSync('export.json', data);
  console.log('Congratulations export.json was successfully written to disk')
}


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');

  // After the app starts, fetch conversations and put them in a simple, in-memory cache
  fetchConversations();
})();