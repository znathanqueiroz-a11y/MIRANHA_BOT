const fs = require("fs");
const { execSync } = require("child_process");

const secret = "/etc/secrets/auth_session.tar.gz";

if (fs.existsSync(secret) && !fs.existsSync("auth_info_baileys")) {
  fs.copyFileSync(secret, "auth_session.tar.gz");
  console.log(fs.readFileSync(secret).subarray(0,16));
  execSync("tar -xzf auth_session.tar.gz");
  console.log("✅ Sessão WhatsApp restaurada");
}
