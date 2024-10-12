import {Manifest} from "deno-slack-sdk/mod.ts";

export default Manifest({
  name: "bold-panda-30",
  description: "A blank template for building Slack apps with Deno",
  icon: "assets/default_new_app_icon.png",
  functions: [],
  workflows: [],
  outgoingDomains: [],
  datastores: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "users.profile:read",
  ],
  userScopes: [
    "users.profile:read",
    "users.profile:write",
  ]
});
