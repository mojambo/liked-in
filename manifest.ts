import {Manifest} from "deno-slack-sdk/mod.ts";

export default Manifest({
  name: "LikedIn",
  description: "A LinkedIn post liker bot",
  icon: "assets/default_new_app_icon.png",
  functions: [],
  workflows: [],
  outgoingDomains: [],
  datastores: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
  ],
  userScopes: [
    "users.profile:read",
  ]
});
